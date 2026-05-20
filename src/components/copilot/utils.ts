
/**
 * Attempt to parse a partial JSON string by closing unclosed structures.
 * Returns the parsed value, or undefined if even repair fails.
 */
export function parsePartialJSON(input: string): any | undefined {
    if (!input) return undefined;
    const repaired = repairPartial(input);
    try {
      return JSON.parse(repaired);
    } catch {
      return undefined;
    }
  }
  
  function repairPartial(s: string): string {
    const stack: string[] = []; // tracks open brackets: '{', '['
    let inString = false;
    let escape = false;
    let lastNonWhitespace = -1;
  
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
  
      if (escape) {
        escape = false;
        continue;
      }
  
      if (ch === '\\' && inString) {
        escape = true;
        continue;
      }
  
      if (ch === '"') {
        inString = !inString;
        lastNonWhitespace = i;
        continue;
      }
  
      if (inString) continue;
  
      if (ch === '{' || ch === '[') {
        stack.push(ch);
      } else if (ch === '}') {
        if (stack[stack.length - 1] === '{') stack.pop();
      } else if (ch === ']') {
        if (stack[stack.length - 1] === '[') stack.pop();
      }
  
      if (!/\s/.test(ch)) lastNonWhitespace = i;
    }
  
    let out = s;
  
    // If we're inside a string, close it
    if (inString) {
      // But first, drop a dangling backslash at the end (incomplete escape)
      if (out.endsWith('\\')) out = out.slice(0, -1);
      out += '"';
    }
  
    // Trim a dangling comma or colon, which would make the JSON invalid
    // even if we close the brackets. e.g.  {"a": 1,   →   {"a": 1
    // and   {"a":                          →   {"a": null
    out = out.replace(/,\s*$/, '');
    out = out.replace(/:\s*$/, ': null');
  
    // Close open structures in reverse order
    while (stack.length > 0) {
      const opener = stack.pop()!;
      out += opener === '{' ? '}' : ']';
    }
  
    return out;
  }