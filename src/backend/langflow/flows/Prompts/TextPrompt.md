## Reference Task
### This task would score 5 across all criteria
{referenceTask}

## Empty Task
### This task would score 0 across all criteria
{emptyTask}

## Student Task
### This is the task you are assessing
{studentTask}

# Task

Compare the student task with the reference and empty tasks. For each key, assess and score the student response based on the following criteria:

1. **Completeness** (0-5):  
   - Score 0 for if it matches the emtpy task.
   - Score 5 if as detailed as the reference task.

2. **Accuracy** (0-5):  
   - Score 0 if it matches the empty task.
   - Score 5 if it matches the reference task in accuracy and detail.

3. **Spelling, Punctuation, and Grammar (SPaG)** (0-5):  
   - Score 0 if entirely incorrect.
   - Score 5 for flawless SPaG.



Provide a short reasoning for each score, no longer than one sentence. Use the following JSON structure:

```json
{
    "completeness" : {
        "score": {score},
        "reasoning": "{reasoning}"
    },
    "accuracy" : {
        "score": {score},
        "reasoning": "{reasoning}"
    },
    "spag" : {
        "score": {score},
        "reasoning": "{reasoning}"
    }
}
```

## Examples:

### Example 1: Partially correct student task

```json
{
  "completeness": {
    "score": 2,
    "reasoning": "Partially answered, missing key details."
  },
  "accuracy": {
    "score": 3,
    "reasoning": "Mostly correct with minor errors."
  },
  "spag": {
    "score": 4,
    "reasoning": "Good SPaG with few errors."
  }
}
```

### Example 2: Student task as good or better than the reference task

```json
{
  "completeness": {
    "score": 5,
    "reasoning": "Thorough and complete."
  },
  "accuracy": {
    "score": 5,
    "reasoning": "All details are accurate."
  },
  "spag": {
    "score": 5,
    "reasoning": "Flawless SPaG."
  }
}
```

### Example 3: No attempt made by the student

```json
{
  "completeness": {
    "score": 0,
    "reasoning": "No content provided."
  },
  "accuracy": {
    "score": 0,
    "reasoning": "No content provided."
  },
  "spag": {
    "score": 0,
    "reasoning": "No content provided."
  }
}
```
*IMPORTANT*: In all cases, assess only the content that differs from the empty slide. The empty slide contains the template that students will write on.