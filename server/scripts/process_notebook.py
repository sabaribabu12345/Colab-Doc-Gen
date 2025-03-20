import sys
import nbformat
import json

def extract_code_and_markdown(file_path):
    with open(file_path, 'r') as f:
        notebook = nbformat.read(f, as_version=4)

    code_cells = []
    markdown_cells = []

    for cell in notebook.cells:
        if cell.cell_type == 'code':
            code_cells.append(cell.source)
        elif cell.cell_type == 'markdown':
            markdown_cells.append(cell.source)

    result = {
        "code": code_cells,
        "markdown": markdown_cells
    }

    print(json.dumps(result))

if __name__ == "__main__":
    file_path = sys.argv[1]
    extract_code_and_markdown(file_path)
