
import { Newtype, iso } from 'newtype-ts'
import randomColor from "randomcolor";
import { hexToRGBAUnit } from '../../graphics/utils';
import { DataID } from "./data";

//#region State
export interface SelectionID extends Newtype<{ readonly SelectionID: unique symbol }, number> { };
export const isoSelectionID = iso<SelectionID>();
export type SelectionColor = { r: number, g: number, b: number, a: number }

export type Selection = {
  id: SelectionID,
  dataID: DataID;

  name: string;
  color: SelectionColor;

  bins: Uint16Array;
};

export type SelectionState = {
  maxId: number;

  selections: Array<Selection>;
}
//#endregion

//#region Reducer
export enum SelectionActionKind {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE',
  SET = 'SET',
}

export type SelectionActionAdd = {
  type: SelectionActionKind.ADD;

  dataID: DataID;
  dataSize: number;
}

export type SelectionActionUpdate = {
  type: SelectionActionKind.UPDATE;

  id: SelectionID;

  name: string | null;
  color: GPUColorDict | null;
  bins: Uint16Array | null;
};

export type SelectionActionRemove = {
  type: SelectionActionKind.REMOVE;

  id: SelectionID;
};

export type SelectionActionSet = {
  type: SelectionActionKind.SET;

  state: SelectionState;
};

export type SelectionAction = SelectionActionAdd | SelectionActionUpdate | SelectionActionRemove | SelectionActionSet;

export function selectionReducer(state: SelectionState, action: SelectionAction): SelectionState {
  switch (action.type) {
    case SelectionActionKind.ADD: {
      const maxId = state.maxId + 1;

      return {
        ...state,
        maxId,
        selections: [...state.selections, {
          id: isoSelectionID.wrap(maxId),
          dataID: action.dataID,
          name: "Selection " + maxId,
          color: hexToRGBAUnit(randomColor(), 1.0),
          bins: new Uint16Array(action.dataSize)
        }]
      };
    }
    case SelectionActionKind.UPDATE: {
      const selectionIndex: number = state.selections.findIndex(e => e.id == action.id);

      if (selectionIndex < 0) {
        return state;
      }

      const newSelections = [...state.selections];

      if (action.name) newSelections[selectionIndex].name = action.name;
      if (action.color) newSelections[selectionIndex].color = action.color;
      if (action.bins) newSelections[selectionIndex].bins = action.bins;

      return {
        ...state,
        selections: newSelections
      }
    }
    case SelectionActionKind.REMOVE: {
      const selectionIndex: number = state.selections.findIndex(e => e.id == action.id);

      if (selectionIndex < 0) {
        return state;
      }

      const newSelections = [...state.selections];
      newSelections.splice(selectionIndex, 1);

      return {
        ...state,
        selections: newSelections
      }
    }
    case SelectionActionKind.SET: {
      return action.state;
    }
    default: return state;
  }
}
//#endregion
