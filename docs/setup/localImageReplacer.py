import os
import re
import requests
from urllib.parse import urlparse
from pathlib import Path
import hashlib

# Configuration
IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg'}
IMAGE_FOLDER = 'images'

def create_image_folder(base_path):
    image_path = base_path / IMAGE_FOLDER
    image_path.mkdir(exist_ok=True)
    return image_path

def get_markdown_files(base_path):
    return list(base_path.glob('*.md'))

def is_image_url(url):
    parsed = urlparse(url)
    _, ext = os.path.splitext(parsed.path)
    return ext.lower() in IMAGE_EXTENSIONS

def sanitize_filename(filename):
    # Remove query parameters and fragments
    filename = filename.split('?')[0].split('#')[0]
    return filename

def generate_unique_filename(image_folder, url):
    parsed = urlparse(url)
    filename = sanitize_filename(os.path.basename(parsed.path))
    if not filename:
        # If URL does not contain a valid filename, generate one using hash
        hash_digest = hashlib.md5(url.encode('utf-8')).hexdigest()
        filename = f'image_{hash_digest}.png'  # Default to .png
    else:
        # Ensure filename is unique within the image folder
        filename = os.path.basename(filename)
    destination = image_folder / filename
    if destination.exists():
        # If file exists, append a hash to make it unique
        name, ext = os.path.splitext(filename)
        hash_digest = hashlib.md5(url.encode('utf-8')).hexdigest()[:8]
        filename = f"{name}_{hash_digest}{ext}"
        destination = image_folder / filename
    return filename

def download_image(url, image_folder):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        filename = generate_unique_filename(image_folder, url)
        image_path = image_folder / filename
        with open(image_path, 'wb') as f:
            f.write(response.content)
        print(f"Downloaded: {url} -> {IMAGE_FOLDER}/{filename}")
        return filename
    except requests.RequestException as e:
        print(f"Failed to download {url}: {e}")
        return None

def process_markdown_file(md_file, image_folder):
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find Markdown image syntax: ![alt](url "title")
    # This regex captures:
    # 1. Alt text
    # 2. URL
    # 3. Optional title
    image_regex = re.compile(r'!\[([^\]]*)\]\((https?://[^\s)]+)(?:\s+"[^"]*")?\)')

    # To keep track of replacements
    replacements = {}

    for match in image_regex.finditer(content):
        alt_text, url = match.group(1), match.group(2)
        if is_image_url(url):
            if url not in replacements:
                filename = download_image(url, image_folder)
                if filename:
                    replacements[url] = os.path.join(IMAGE_FOLDER, filename).replace('\\', '/')
            else:
                # Image already processed
                filename = os.path.basename(replacements[url])
            if url in replacements:
                relative_path = replacements[url]
                # Escape parentheses in the path
                relative_path = relative_path.replace('(', r'\(').replace(')', r'\)')
                # Create the new Markdown image syntax
                new_image_syntax = f'![{alt_text}]({relative_path})'
                # Replace the old syntax with the new one
                old_syntax = match.group(0)
                content = content.replace(old_syntax, new_image_syntax)

    # Write the updated content back to the file
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Processed file: {md_file.name}")

def main():
    base_path = Path.cwd()
    image_folder = create_image_folder(base_path)
    markdown_files = get_markdown_files(base_path)

    if not markdown_files:
        print("No Markdown files found in the current directory.")
        return

    for md_file in markdown_files:
        process_markdown_file(md_file, image_folder)

    print("All files processed.")

if __name__ == "__main__":
    main()
