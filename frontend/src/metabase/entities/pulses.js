import { createThunkAction } from "metabase/lib/redux";
import { setRequestState } from "metabase/redux/requests";
import { normalize } from "normalizr";

import { createEntity, undo } from "metabase/lib/entities";
import * as Urls from "metabase/lib/urls";
import { normal } from "metabase/lib/colors";

import {
  canonicalCollectionId,
  getCollectionType,
} from "metabase/entities/collections";

import { POST } from "metabase/lib/api";

const COPY_ACTION = `metabase/entities/pulses/COPY`;

const Pulses = createEntity({
  name: "pulses",
  path: "/api/pulse",

  api: {
    copy: POST("/api/pulse/:id/copy"),
  },

  objectActions: {
    setArchived: ({ id }, archived, opts) =>
      Pulses.actions.update(
        { id },
        { archived },
        undo(opts, "pulse", archived ? "archived" : "unarchived"),
      ),

    setCollection: ({ id }, collection, opts) =>
      Pulses.actions.update(
        { id },
        { collection_id: canonicalCollectionId(collection && collection.id) },
        undo(opts, "pulse", "moved"),
      ),

    setPinned: ({ id }, pinned, opts) =>
      Pulses.actions.update(
        { id },
        {
          collection_position:
            typeof pinned === "number" ? pinned : pinned ? 1 : null,
        },
        opts,
      ),

      copy: ({ id }, overrides, opts) => 
        Pulses.actions.copy(
          { id },
          overrides,
          opts,
        ),
  },

  actions: {
    copy: createThunkAction(
      COPY_ACTION,
      (entityObject, overrides) => async (dispatch, getState) => {
        const statePath = ["entities", entityObject.name, entityObject.id, "copy"];
        try {
          dispatch(setRequestState({ statePath, state: "LOADING" }));
          const result = normalize(
            await Pulses.api.copy({ id: entityObject.id, ...overrides}),
            Pulses.schema,
          );
          dispatch(setRequestState({ statePath, state: "LOADED" }));
          dispatch({ type: Pulses.actionTypes.INVALIDATE_LISTS_ACTION });
          return result;
        } catch (error) {
          console.error(`${COPY_ACTION} failed:`, error);
          dispatch(setRequestState({ statePath, error }));
          throw error;
        }
      },
    ),
  },

  objectSelectors: {
    getName: pulse => pulse && pulse.name,
    getUrl: pulse => pulse && Urls.pulse(pulse.id),
    getIcon: pulse => "pulse",
    getColor: pulse => normal.yellow,
  },

  reducer: (state = {}, { type, payload, error }) => {
    if (type === COPY_ACTION && !error && state[""]) {
      return { ...state, "": state[""].concat([payload.result]) };
    }
    return state;
  },

  form: {
    fields: [
      { name: "name" },
      {
        name: "collection_id",
        title: "Collection",
        type: "collection",
      },
    ],
  },

  getAnalyticsMetadata(action, object, getState) {
    const type = object && getCollectionType(object.collection_id, getState());
    return type && `collection=${type}`;
  },
});

export default Pulses;