import { api, type ApiError } from "@/network/core/api";
import { ENDPOINTS } from "@/constants/endpoints";
import type {
  CreateUploadInput,
  ListUploadsQuery,
} from "@/@types/request/upload";
import type {
  GetUploadErrorResponse,
  GetUploadResponse,
  GetUploadSuccessResponse,
  ListUploadsResponse,
  ListUploadsSuccessResponse,
  UploadErrorResponse,
  UploadResponse,
  UploadSuccessResponse,
} from "@/@types/response/upload";

export async function createUpload(
  input: CreateUploadInput,
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("name", input.name);
  form.append("type", input.type);
  form.append("file", input.file);

  try {
    const { data } = await api.post<UploadSuccessResponse>(
      ENDPOINTS.UPLOADS.CREATE,
      form,
    );
    return data;
  } catch (err) {
    const payload = (err as ApiError).response?.data as
      | UploadErrorResponse
      | undefined;
    if (payload && typeof payload === "object" && "error" in payload) {
      return payload;
    }
    throw err;
  }
}

export function isUploadSuccess(
  res: UploadResponse,
): res is UploadSuccessResponse {
  return !("error" in res);
}

export async function listUploads(
  query: ListUploadsQuery = {},
): Promise<ListUploadsResponse> {
  const url = query.cursor
    ? `${ENDPOINTS.UPLOADS.LIST}?cursor=${encodeURIComponent(query.cursor)}`
    : ENDPOINTS.UPLOADS.LIST;
  const { data } = await api.get<ListUploadsSuccessResponse>(url);
  return data;
}

export function isListSuccess(
  res: ListUploadsResponse,
): res is ListUploadsSuccessResponse {
  return !("error" in res);
}

export async function getUpload(id: string): Promise<GetUploadResponse> {
  try {
    const { data } = await api.get<GetUploadSuccessResponse>(
      ENDPOINTS.UPLOADS.DETAIL(id),
    );
    return data;
  } catch (err) {
    const payload = (err as ApiError).response?.data as
      | GetUploadErrorResponse
      | undefined;
    if (payload && typeof payload === "object" && "error" in payload) {
      return payload;
    }
    throw err;
  }
}

export function isGetUploadSuccess(
  res: GetUploadResponse,
): res is GetUploadSuccessResponse {
  return !("error" in res);
}
