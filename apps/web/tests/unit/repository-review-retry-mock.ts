export type Operation = {
  action: string;
  filters: Array<{ column: string; value: unknown }>;
  table: string;
  values?: unknown;
};

export type MockClient = ReturnType<typeof createMockClient>;

export const PAPER_ROW = {
  owner_user_id: "user_1",
  title: "Retry paper",
  workspace_id: "workspace_1",
};

export const REVIEW_ROW = {
  id: "review_1",
  paper_id: "paper_1",
  paper_version_id: "version_1",
  status: "failed",
};

export function countOperations(
  client: MockClient,
  predicate: (operation: Operation) => boolean,
) {
  return client.operations.filter(predicate).length;
}

export function findUpdate(client: MockClient, table: string) {
  return client.operations.find(
    (operation) => operation.table === table && operation.action === "update",
  )?.values;
}

export function createMockClient(options: {
  affectedReviews?: Array<{ id: string }>;
  paperRow?: Record<string, unknown>;
  reviewRow?: Record<string, unknown>;
  versionRow?: Record<string, unknown>;
}) {
  const operations: Operation[] = [];

  function resolve(
    table: string,
    action: string,
    filters: Operation["filters"],
  ) {
    if (action === "select" && table === "reviews") {
      const isSingleReview = filters.some((filter) => filter.column === "id");
      return {
        data: isSingleReview ? options.reviewRow : options.affectedReviews,
        error: null,
      };
    }

    if (action === "select" && table === "papers") {
      return { data: options.paperRow, error: null };
    }

    if (action === "select" && table === "paper_versions") {
      return { data: options.versionRow, error: null };
    }

    return { error: null };
  }

  return {
    operations,
    from(table: string) {
      const state: Operation = { action: "", filters: [], table };
      const builder = {
        delete() {
          state.action = "delete";
          state.values = undefined;
          operations.push(state);
          return builder;
        },
        eq(column: string, value: unknown) {
          state.filters.push({ column, value });
          return builder;
        },
        in(column: string, value: unknown) {
          state.filters.push({ column, value });
          return builder;
        },
        insert(value: unknown) {
          operations.push({
            action: "insert",
            filters: [],
            table,
            values: value,
          });
          return Promise.resolve({ error: null });
        },
        maybeSingle() {
          return Promise.resolve(resolve(table, state.action, state.filters));
        },
        select() {
          state.action = "select";
          return builder;
        },
        then(
          resolvePromise: (value: unknown) => void,
          rejectPromise: () => void,
        ) {
          return Promise.resolve(
            resolve(table, state.action, state.filters),
          ).then(resolvePromise, rejectPromise);
        },
        update(value: unknown) {
          state.action = "update";
          state.values = value;
          operations.push(state);
          return builder;
        },
      };

      return builder;
    },
  };
}
