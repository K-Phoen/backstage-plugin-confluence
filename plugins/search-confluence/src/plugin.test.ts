import { confluencePlugin } from './plugin';

describe('search-confluence', () => {
  it('should export confluencePlugin', () => {
    expect(confluencePlugin).toBeDefined();
  });
});
