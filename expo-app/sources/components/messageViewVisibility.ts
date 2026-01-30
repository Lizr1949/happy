export const shouldShowThinkingMessage = (
    isThinking: boolean | undefined,
    experimentsEnabled: boolean,
): boolean => {
    if (!isThinking) {
        return true;
    }
    return experimentsEnabled;
};
