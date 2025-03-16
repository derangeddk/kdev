

export function isYes(answer, { defaultValue = true } = {}) {
    if (answer === '') return defaultValue;

    if (answer.toLowerCase() === 'y') return true;
    if (answer.toLowerCase() === 'ye') return true;
    if (answer.toLowerCase() === 'yes') return true;

    return false;
}
