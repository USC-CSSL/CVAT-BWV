import { getCVATStore } from "cvat-store";
import { CombinedState } from "reducers";

export default function getAutoIncrementedIdentifierAttr(label: any): number {
    const store = getCVATStore();

    const state: CombinedState = store.getState();

    const {annotation: {annotations: {allStates}}} = state;
    const relevant = allStates.filter(state => state.label.id === label.id);
    const identifierAttrId = label.attributes?.find((attr: any) => attr.name === 'identifier').id;
    const maxIdentifier = relevant.reduce(
        (prev, state) => Math.max(prev, parseInt(state.attributes[identifierAttrId] || '0')),
        0
    );
    return maxIdentifier + 1;
}