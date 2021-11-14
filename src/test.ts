import config from './helper/config';
import { getBlockchainInfoFromURL } from './helper/url-parser';

async function method(a: any): Promise<any> {
  return a;
}
(async () => {
  console.log(config);

  const result = await Promise.all(
    [1, 2, 3, 4, 5]
      .map((e) => async () => {
        return method(e);
      })
      .map((e) => e()),
  );
})();
