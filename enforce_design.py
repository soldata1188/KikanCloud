import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Original content for comparison
    original = content

    # 1. Remove all shadow classes (e.g., shadow-sm, shadow-md, shadow, shadow-black/5, drop-shadow-sm)
    content = re.sub(r'\b(drop-)?shadow(-[a-zA-Z0-9/\[\]]+)?\b', '', content)

    # 2. Update border colors to border-gray-400 where border is present.
    # First, let's find classes like border-gray-100, border-gray-200, border-[#ededed], etc.
    # and replace them with border-gray-400.
    content = re.sub(r'\bborder-(gray-\d{2,3}|\[#[a-fA-F0-9]+\]|transparent|teal-\d{2,3})\b', 'border-gray-400', content)
    
    # 3. Clean up multiple spaces that might have been left by regex
    content = re.sub(r' +', ' ', content)
    # Fix spaces before quotes in classNames
    content = re.sub(r' "', '"', content)
    # Fix spaces before backticks in classNames
    content = re.sub(r' `', '`', content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def scan_and_replace(directory):
    modified_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js', '.jsx', '.css')):
                filepath = os.path.join(root, file)
                if process_file(filepath):
                    # Store relative path for cleaner output
                    rel_path = os.path.relpath(filepath, directory)
                    modified_files.append(rel_path)
    
    return modified_files

if __name__ == '__main__':
    src_dir = os.path.join(os.getcwd(), 'src')
    modified = scan_and_replace(src_dir)
    print(f"Modified {len(modified)} files.")
    for f in modified:
        print(f" - {f}")
