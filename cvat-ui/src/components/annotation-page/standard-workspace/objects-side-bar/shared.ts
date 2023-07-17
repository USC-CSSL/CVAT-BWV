import { ObjectState } from 'cvat-core-wrapper';
import { ColorBy } from 'reducers';

export function getColor(state: ObjectState, colorBy: ColorBy): string {
    let color = '';
    if (state.source === 'auto_unlabeled' || state.source === 'manual_unlabeled') {
        color = '#cdcdcd';
    }
    else if (colorBy === ColorBy.INSTANCE) {
        color = state.color;
    } else if (colorBy === ColorBy.GROUP) {
        color = state.group?.color || '#000';
    } else if (colorBy === ColorBy.LABEL) {
        color = state.label.color as string;
    }

    return color;
}
