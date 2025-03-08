import { fetchWithError } from './fetchWithError';

global.fetch = jest.fn();

describe('fetchWithError', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should return parsed JSON response on success', async () => {
    const mockResponse = { data: 'test' };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await fetchWithError({
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: {},
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/data', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
  });

  it('should throw an error on HTTP error response', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      fetchWithError({
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: {},
      })
    ).rejects.toThrow('HTTP error! status: 404');
  });
});
