export async function readApiResponse(response) {
  try {
    const data=await response.json();
    if (!data || typeof data !== 'object') throw Error('Invalid API payload');
    return data;
  } catch {
    const error=new Error('The server could not complete this request. Please refresh and try again.');
    error.status=response.status;
    error.code='INVALID_API_RESPONSE';
    throw error;
  }
}
