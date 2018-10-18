/* @flow */

import { createThunkAction } from "metabase/lib/redux";
import { setRequestState } from "metabase/redux/requests";
import { normalize } from "normalizr";

import { assocIn } from "icepick";

import { createEntity, undo } from "metabase/lib/entities";
import * as Urls from "metabase/lib/urls";
import colors from "metabase/lib/colors";

import {
  canonicalCollectionId,
  getCollectionType,
} from "metabase/entities/collections";

import { POST, DELETE } from "metabase/lib/api";

const FAVORITE_ACTION = `metabase/entities/questions/FAVORITE`;
const UNFAVORITE_ACTION = `metabase/entities/questions/UNFAVORITE`;
const COPY_ACTION = `metabase/entities/dashboards/COPY`;

const Questions = createEntity({
  name: "questions",
  path: "/api/card",

  api: {
    favorite: POST("/api/card/:id/favorite"),
    unfavorite: DELETE("/api/card/:id/favorite"),
    copy: POST("/api/card/:id/copy"),
  },

  objectActions: {
    setArchived: ({ id }, archived, opts) =>
      Questions.actions.update(
        { id },
        { archived },
        undo(opts, "question", archived ? "archived" : "unarchived"),
      ),

    setCollection: ({ id }, collection, opts) =>
      Questions.actions.update(
        { id },
        { collection_id: canonicalCollectionId(collection && collection.id) },
        undo(opts, "question", "moved"),
      ),

    setPinned: ({ id }, pinned, opts) =>
      Questions.actions.update(
        { id },
        {
          collection_position:
            typeof pinned === "number" ? pinned : pinned ? 1 : null,
        },
        opts,
      ),

    setFavorited: async ({ id }, favorite) => {
      if (favorite) {
        await Questions.api.favorite({ id });
        return { type: FAVORITE_ACTION, payload: id };
      } else {
        await Questions.api.unfavorite({ id });
        return { type: UNFAVORITE_ACTION, payload: id };
      }
    },

    copy: ({ id }, overrides, opts) => 
      Questions.actions.copy(
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
            await Questions.api.copy({ id: entityObject.id, ...overrides}),
            Questions.schema,
          );
          dispatch(setRequestState({ statePath, state: "LOADED" }));
          dispatch({ type: Questions.actionTypes.INVALIDATE_LISTS_ACTION });
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
    getName: question => question && question.name,
    getUrl: question => question && Urls.question(question.id),
    getColor: () => colors["text-medium"],
    getIcon: question =>
      (require("metabase/visualizations").default.get(question.display) || {})
        .iconName || "beaker",
  },

  reducer: (state = {}, { type, payload, error }) => {
    if (type === FAVORITE_ACTION && !error) {
      return assocIn(state, [payload, "favorite"], true);
    } else if (type === UNFAVORITE_ACTION && !error) {
      return assocIn(state, [payload, "favorite"], false);
    } else if (type === COPY_ACTION && !error && state[""]) {
      return { ...state, "": state[""].concat([payload.result]) };
    }
    return state;
  },

  form: {
    fields: [
      { name: "name" },
      { name: "description", type: "text" },
      {
        name: "collection_id",
        title: "Collection",
        type: "collection",
      },
    ],
  },

  // NOTE: keep in sync with src/metabase/api/card.clj
  writableProperties: [
    "name",
    "dataset_query",
    "display",
    "description",
    "visualization_settings",
    "archived",
    "enable_embedding",
    "embedding_params",
    "collection_id",
    "collection_position",
    "result_metadata",
    "metadata_checksum",
  ],

  getAnalyticsMetadata(action, object, getState) {
    const type = object && getCollectionType(object.collection_id, getState());
    return type && `collection=${type}`;
  },
});

export default Questions;