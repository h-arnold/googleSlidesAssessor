# 🖋️ Contributing to the documentation
Thank you for considering contributing to this project! To ensure a consistent and high-quality experience for users, please follow the guidelines below when creating or editing documentation.

- [🖋️ Contributing to the documentation](#️-contributing-to-the-documentation)
  - [✍️ Writing Style](#️-writing-style)
  - [🛠️ Formatting Style Guide](#️-formatting-style-guide)
    - [Headings](#headings)
    - [Lists](#lists)
    - [Images](#images)
    - [Links](#links)
  - [📜 General Guidelines](#-general-guidelines)
  - [🖼️ Example Template](#️-example-template)
  - [🤖 Prompting Assistance for Style Guide Updates](#-prompting-assistance-for-style-guide-updates)
  - [🔄 Submitting Changes](#-submitting-changes)


---

## ✍️ Writing Style

- **Be concise**: Use clear, simple, and direct language.
- **Use British English**: Ensure spelling and grammar adhere to British English conventions.
- **Emphasise important points**: Use bold (**bold**) or italic (*italic*) text to highlight critical information.
- **Add tips and notes**: Use phrases like "💡 Tip" or "⚠️ Note" to call out additional details or warnings.

---

## 🛠️ Formatting Style Guide

### Headings

- Use a structured hierarchy for headings:
  - `#` for top-level headings (e.g., document titles)
  - `##` for section headings
  - `###` for sub-sections
  - `####` for further breakdowns
- Add relevant emojis to headings sparingly to enhance visual appeal.

**Example:**
```markdown
## 📂 Setting Up Your Environment
```

### Lists

- Use numbered lists for step-by-step instructions.
- Use bullet points for unordered lists and general information.

**Example:**
```markdown
1. Clone the repository.
2. Navigate to the project directory.
3. Run the setup script.

- This is an unordered list item.
```

### Images

- Store all images relative to the Markdown file's location.
- Use the `<img>` HTML tag for images to control their size.
- Set the `width` attribute to `400px` for all images unless otherwise specified.
- Provide descriptive `alt` text for accessibility.

**Example:**
```markdown
<img src="images/example_image.png" alt="Description of the image" width="400">
```

### Links

- Use relative paths for internal links (e.g., `./images/example.png`).
- For external links, always include a descriptive label.

**Example:**
```markdown
[Learn more about Markdown](https://www.markdownguide.org/)
```

---

## 📜 General Guidelines

1. **Clarity**: Avoid jargon and explain technical terms when they are first introduced.
2. **Consistency**: Follow the same structure and formatting throughout the document.
3. **Testing**: Preview your changes to ensure the layout and links work as expected.

---

## 🖼️ Example Template

Here’s a quick reference template for writing new documentation:

```markdown
# Title of the Documentation

## 📄 Overview

Provide a brief description of what this document is about.

---

## 🔧 Steps to Follow

1. Step one.
   <img src="images/step1_example.png" alt="Step 1 visual" width="400">
   
2. Step two.
   <img src="images/step2_example.png" alt="Step 2 visual" width="400">

---

## 💡 Tips and Tricks

- 💡 **Tip**: Useful information to help users succeed.
- ⚠️ **Note**: Important warnings or caveats.
```

---

## 🤖 Prompting Assistance for Style Guide Updates

If you're unsure how to align your documentation with this style guide, you can an LLM like ChatGPT to update your documents. Simply:

1. Share your existing documentation.
2. Ask the assistant to "Update my documentation to align with the CONTRIBUTING.md style guide." (make sure you post this document above)
3. Review the updated version for accuracy and clarity.

By leveraging this, you can ensure your contributions remain consistent with our standards while saving time. 🚀

---

## 🔄 Submitting Changes

1. Fork the repository.
2. Create a branch for your changes.
3. Make your updates following this style guide.
4. Submit a pull request with a detailed description of your changes.

