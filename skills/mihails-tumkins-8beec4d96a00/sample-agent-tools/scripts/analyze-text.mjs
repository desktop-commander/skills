import { readFileSync } from 'fs';

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
    const text = input.trim();
    if (!text) {
        console.log(JSON.stringify({ error: "No input provided" }));
        process.exit(1);
    }
    
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = text.length;
    const linesCount = text.split('\n').length;
    
    const result = {
        wordCount,
        charCount,
        linesCount,
        preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    };
    
    console.log(JSON.stringify(result, null, 2));
});
