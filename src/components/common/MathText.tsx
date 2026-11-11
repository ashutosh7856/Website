import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
    children: string;
    className?: string;
}

/**
 * MathText Component
 * 
 * Renders text with LaTeX math formulas. Use $ for inline math and $$ for block math.
 * Handles auto-conversion for Greek letters, chemistry formulas, and exponents.
 */
export function MathText({ children, className = '' }: MathTextProps): React.ReactElement {
    if (!children) return <span className={className}></span>;

    // Fix common encoding glitches (e.g., garbled dashes/symbols from double-encoding)
    // and normalize common unicode math symbols to LaTeX for "perfect" rendering
    let normalized = children
        // Fix mangled dashes/punctuation from multi-stage encoding issues (UTF-8 bytes read as Latin-1)
        .replace(/ÃÂ¢ÃÂÃÂ|Ã¢â‚¬â€œ|â€“|â€”|ÃÂ¢ÃÂ|ÃÂÃÂ|Ã‚Â|Ã‚Â²/g, '-')
        .replace(/[\u2013\u2014\u2212\u2010\u2011]/g, '-')
        .replace(/ÃÂ¢ÃÂÃÂ|Ã¢â‚¬â„¢|â€™|Ã¢â‚¬â„¢/g, "'")
        .replace(/ÃÂ¢ÃÂÃÂ|Ã¢â‚¬Å“|Ã¢â‚¬Â|â€œ|â€|Ã¢â‚¬Â\u009D/g, '"');

    // Automatically convert raw unicode Greek letters and math symbols to LaTeX
    // only if they aren't already wrapped in $ symbols.
    // This mapping helps them look "perfect" as formulas.
    const symbolMap: Record<string, string> = {
        // Greek Lowercase
        'π': '\\pi', 'Ïâ‚¬': '\\pi', 'Ãπ': '\\pi', 'Ï\u0080': '\\pi',
        'θ': '\\theta', 'Î¸': '\\theta', 'ÃŽÂ¸': '\\theta',
        'α': '\\alpha', 'Î±': '\\alpha', 'ÃŽÂ±': '\\alpha',
        'β': '\\beta', 'Î²': '\\beta', 'ÃÂ²': '\\beta', 'ÃŽÂ²': '\\beta',
        'γ': '\\gamma', 'Î³': '\\gamma', 'ÃŽÂ³': '\\gamma',
        'δ': '\\delta', 'Î´': '\\delta', 'ÃŽÂ´': '\\delta',
        'λ': '\\lambda', 'Î»': '\\lambda', 'ÃŽÂ»': '\\lambda',
        'μ': '\\mu', 'Î¼': '\\mu', 'ÃŽÂ¼': '\\mu',
        'ω': '\\omega', 'Ï‰': '\\omega', 'ÃÏ‰': '\\omega',
        'φ': '\\phi', 'Ïâ€': '\\phi', 'Ï\u0086': '\\phi',
        'ψ': '\\psi', 'ÏË†': '\\psi',
        'η': '\\eta', 'Î·': '\\eta',
        'ρ': '\\rho', 'Ï\u0081': '\\rho',
        'σ': '\\sigma', 'Ï\u0083': '\\sigma',
        'τ': '\\tau', 'Ï\u0084': '\\tau',
        'ε': '\\epsilon', 'Îµ': '\\epsilon',

        // Greek Uppercase
        'Δ': '\\Delta', 'Î”': '\\Delta', 'ÃŽ\u0094': '\\Delta', 'âˆ†': '\\Delta',
        'Σ': '\\Sigma', 'Î£': '\\Sigma', 'ÃŽÂ£': '\\Sigma',
        'Ω': '\\Omega', 'Î©': '\\Omega', 'ÃŽÂ©': '\\Omega',
        'Φ': '\\Phi', 'Î¦': '\\Phi', 'ÃŽÂ¦': '\\Phi',

        // Math Symbols
        '±': '\\pm', 'Â±': '\\pm', 'Ã‚Â±': '\\pm',
        '∞': '\\infty', 'âˆž': '\\infty', 'Ã¢Ë†Å¾': '\\infty',
        '≈': '\\approx', 'â‰ˆ': '\\approx',
        '≠': '\\neq', 'â‰\u00A0': '\\neq',
        '≤': '\\le', 'â‰¤': '\\le',
        '≥': '\\ge', 'â‰¥': '\\ge',
        '×': '\\times', 'Ã—': '\\times', 'â€”': '\\times', 'Ã¢â‚¬â€\u009D': '\\times',
        '÷': '\\div', 'Ã·': '\\div',
        '→': '\\rightarrow', 'â†’': '\\rightarrow',
        '⇒': '\\Rightarrow', 'â‡’': '\\Rightarrow',
        '∠': '\\angle',
        '∂': '\\partial', 'âˆ‚': '\\partial',
        '∫': '\\int', 'âˆ«': '\\int',
        '√': '\\sqrt', 'âˆš': '\\sqrt',
        '∇': '\\nabla', 'âˆ‡': '\\nabla'
    };

    // Replace raw symbols (we'll wrap them in $ only if they aren't already in math)
    Object.entries(symbolMap).forEach(([char, latex]) => {
        const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedChar, 'g');
        normalized = normalized.replace(regex, (match: string, offset: number, fullString: string): string => {
            // Check if already in math or preceded by backslash
            const before = fullString.slice(Math.max(0, offset - 1), offset);
            const after = fullString.slice(offset + match.length, offset + match.length + 1);
            if (before === '$' || after === '$' || before === '\\') return latex;
            return `$${latex}$`;
        });
    });

    // --- SCIENCE AUTO-CONVERSION ---
    // Handle standalone Greek words like 'pi', 'theta' if they are not in math
    const greekKeywords = ['pi', 'theta', 'alpha', 'beta', 'gamma', 'delta', 'lambda', 'mu', 'phi', 'psi', 'omega'];
    greekKeywords.forEach(kw => {
        const re = new RegExp(`(?<![\\\\$])\\b${kw}\\b(?![\\$])`, 'gi');
        normalized = normalized.replace(re, `$\\${kw}$`);
    });

    // Handle Simple Chemical Formulas: H2O, CO2, H2SO4
    normalized = normalized.replace(/(?<![$])\b([A-Z][a-z]?\d+([A-Z][a-z]?\d*)*)\b(?![\\$])/g, (match) => {
        if (/\d/.test(match)) {
            const latex = match.replace(/(\d+)/g, '_{$1}');
            return `$${latex}$`;
        }
        return match;
    });

    // Handle simple powers: 10^5, x^2 (only if not in math)
    normalized = normalized.replace(/(?<![$])\b([a-zA-Z0-9]+)\^([a-zA-Z0-9]+)\b(?![\\$])/g, '$$$1^{$2}$$');

    // Cleanup: Remove suspicious double $$ or $ $ created by the above logic
    normalized = normalized.replace(/\$\$\$/g, '$');
    normalized = normalized.replace(/([^$])\$ \$/g, '$1$');
    normalized = normalized.replace(/\$\s+\$/g, '$');
    normalized = normalized.replace(/\$\$+/g, (match) => match === '$$' ? '$$' : '$');

    // Parse text for LaTeX patterns
    const parts: React.ReactNode[] = [];
    const remaining = normalized;
    let key = 0;

    // First, handle block math ($$...$$)
    const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
    let lastIndex = 0;
    let match;

    // Process the text to find math expressions
    const processInlineMath = (text: string): React.ReactNode[] => {
        const inlineParts: React.ReactNode[] = [];
        const inlineRegex = /\$((?:[^$\\]|\\.)+)\$/g;
        let inlineLastIndex = 0;
        let inlineMatch;

        while ((inlineMatch = inlineRegex.exec(text)) !== null) {
            // Add text before the match
            if (inlineMatch.index > inlineLastIndex) {
                inlineParts.push(
                    <span key={`text-${key++}`}>{text.substring(inlineLastIndex, inlineMatch.index)}</span>
                );
            }

            // Add the inline math
            try {
                inlineParts.push(
                    <InlineMath key={`math-${key++}`} math={inlineMatch[1]} />
                );
            } catch {
                // If LaTeX parsing fails, show the original text
                inlineParts.push(
                    <span key={`error-${key++}`} className="text-red-500">{inlineMatch[0]}</span>
                );
            }

            inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
        }

        // Add remaining text
        if (inlineLastIndex < text.length) {
            inlineParts.push(
                <span key={`text-${key++}`}>{text.substring(inlineLastIndex)}</span>
            );
        }

        return inlineParts.length > 0 ? inlineParts : [<span key={`text-${key++}`}>{text}</span>];
    };

    while ((match = blockMathRegex.exec(remaining)) !== null) {
        // Add text before the block math (with inline math processing)
        if (match.index > lastIndex) {
            const textBefore = remaining.substring(lastIndex, match.index);
            parts.push(...processInlineMath(textBefore));
        }

        // Add the block math
        try {
            parts.push(
                <div key={`block-${key++}`} className="my-2">
                    <BlockMath math={match[1]} />
                </div>
            );
        } catch {
            parts.push(
                <div key={`error-${key++}`} className="text-red-500 my-2">{match[0]}</div>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    // Process remaining text for inline math
    if (lastIndex < remaining.length) {
        parts.push(...processInlineMath(remaining.substring(lastIndex)));
    }

    // If no math was found, return plain text
    if (parts.length === 0) {
        return <span className={className}>{children}</span>;
    }

    return <span className={className}>{parts}</span>;
}

export default MathText;
