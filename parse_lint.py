import re
import sys

def parse_lint(filename):
    files_with_entities = set()
    files_with_unused = set()
    files_with_any = set()
    
    current_file = None
    
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            
            # Check for file path
            if line.endswith('.ts') or line.endswith('.tsx') or line.endswith('.js') or line.endswith('.jsx'):
                current_file = line
                continue
            
            if current_file:
                if 'react/no-unescaped-entities' in line:
                    files_with_entities.add(current_file)
                elif 'no-unused-vars' in line:
                    files_with_unused.add(current_file)
                elif 'no-explicit-any' in line:
                    files_with_any.add(current_file)

    print("Files with unescaped entities:")
    for f in sorted(list(files_with_entities)):
        print(f)
        
    print("\nFiles with unused variables:")
    for f in sorted(list(files_with_unused)):
        print(f)
        
    print("\nFiles with explicit any:")
    for f in sorted(list(files_with_any)):
        print(f)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        parse_lint(sys.argv[1])
    else:
        print("Usage: python parse_lint.py <lint_report_file>")
