

export default function getLabelDisplayName(labelName: string): string {
    const split = labelName.split(':');
    return split.length > 1 ? split.slice(1).join(':') : split[0];
}
