export const enum QueryParams {
  limit = 'limit',
  offset = 'offset',
  search = 'search',
}

export type QueryParamsDto = {
  [QueryParams.limit]: string;
  [QueryParams.offset]?: string;
  [QueryParams.search]?: string;
};
