export async function readResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('O servidor não respondeu como esperado. Confira se o backend está rodando na porta 3001.');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

export function connectionMessage(error) {
  return error instanceof TypeError
    ? 'Não foi possível conectar. Confira se a interface e o servidor estão rodando.'
    : error.message;
}
