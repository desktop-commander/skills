import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Validates Mermaid syntax using mermaid-cli.
 * Usage: node validate-mermaid.mjs <path-to-file>
 */

const filePath = process.argv[2];
if (!filePath) {
    console.error('Error: No file path provided.');
    process.exit(1);
}

try {
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract mermaid code from markdown if needed
    let mermaidCode = content;
    const match = content.match(/```mermaid([\s\S]*?)```/);
    if (match) {
        mermaidCode = match[1].trim();
    }

    const tempFile = join(process.cwd(), 'temp_validate.mmd');
    writeFileSync(tempFile, mermaidCode);

    console.log('Validating Mermaid syntax...');
    // We use -v to just check syntax without generating an output file if possible, 
    // but mmdc usually requires an output. We'll use a temp output.
    const tempOutput = join(process.cwd(), 'temp_validate.svg');
    
    try {
        execSync(`npx -y @mermaid-js/mermaid-cli -i "${tempFile}" -o "${tempOutput}"`, { stdio: 'pipe' });
        console.log('✅ Mermaid syntax is valid!');
        
        // Cleanup
        unlinkSync(tempFile);
        unlinkSync(tempOutput);
    } catch (err) {
        console.error('❌ Mermaid syntax error:');
        console.error(err.stderr?.toString() || err.message);
        
        if (readFileSync(tempFile)) unlinkSync(tempFile);
        process.exit(1);
    }

} catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
}
