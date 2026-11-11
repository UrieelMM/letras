export type TextUnits = 'lines' | 'words' | 'letters';

export function renderTextUnits(text: string, units: TextUnits, rainbow?: boolean) {
  if (units === 'lines') return text;

  let letterIndex = 0;
  return text.split(/(\s+)/u).map((word, index) => {
    if (!word || /^\s/u.test(word)) return word;
    const letters = units === 'letters' ? word.match(/\P{M}\p{M}*|\p{M}+/gu) ?? [] : [];
    return (
      <span
        key={index}
        className={`g-word ${rainbow && units === 'words' ? 'g-rainbow' : ''}`}
        style={{
          display: 'inline-block',
          maxWidth: '100%',
          animationDelay: rainbow && units === 'words' ? `${index * 0.06}s` : undefined,
        }}
      >
        {units === 'words' ? word : letters.map((letter, position) => (
          <span
            key={position}
            className={`g-char ${rainbow ? 'g-rainbow' : ''}`}
            style={{
              display: 'inline-block',
              animationDelay: rainbow ? `${letterIndex++ * 0.06}s` : undefined,
            }}
          >
            {letter}
          </span>
        ))}
      </span>
    );
  });
}
