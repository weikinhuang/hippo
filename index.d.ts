declare module 'be-hippo' {

  type ACCEPTED_MIME_TYPE = 'application/json' | 'application/x-www-form-urlencoded';

  type KeyValuePair = { [k: string]: any };

  type Descriptor = {
    [name: string]: {
      accept?: ACCEPTED_MIME_TYPE[],
      href: string,
    },
  }

  export type Connection = string | {
    name: string,
    data?: KeyValuePair,
  };

  export type HippoRequestOptions = RequestInit | KeyValuePair;

  type ClientOptions = {
    walkOptions: HippoRequestOptions,
    requestOptions: HippoRequestOptions,
  };

  export type HippoRequestBody = KeyValuePair | FormData | string;
  export type HippoRequestParams = KeyValuePair;

  class Resource {
    constructor(descriptor: { _links: Descriptor }, options?: HippoRequestOptions);

    description(): Descriptor;

    getConnection(connectionName: Connection): string;

    getAccept(connectionName: Connection): ACCEPTED_MIME_TYPE[];

    get(params?: HippoRequestParams, options?: HippoRequestOptions): Promise<Response>;

    head(params?: HippoRequestParams, options?: HippoRequestOptions): Promise<Response>;

    post(body?: HippoRequestBody, params?: HippoRequestParams, options?: HippoRequestOptions): Promise<Response>;

    put(body?: HippoRequestBody, params?: HippoRequestParams, options?: HippoRequestOptions): Promise<Response>;

    patch(body?: HippoRequestBody, params?: HippoRequestParams, options?: HippoRequestOptions): Promise<Response>;

    delete(body?: HippoRequestBody, params?: HippoRequestParams, options?: HippoRequestOptions): Promise<Response>;

    clearCache(): void;
  }

  export class Client {
    constructor(apiRoot: string, options?: ClientOptions);

    walk(...shortNames: Connection[]): Promise<Resource>;

    _getRootDescriptor(): Promise<Resource>;

    _getDescriptor(uri: string): Promise<Resource>;

    clearDescriptorCache(): void;
  }

  export default Client;
}
