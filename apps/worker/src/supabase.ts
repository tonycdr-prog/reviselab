type SupabaseResult<T> = {
  data: T;
  error: {
    message: string;
  } | null;
};

export async function requireSupabaseResult<T>(
  operation: PromiseLike<SupabaseResult<T>>,
  fallbackMessage: string,
) {
  const result = await operation;

  if (result.error) {
    throw new Error(result.error.message || fallbackMessage);
  }

  return result.data;
}
