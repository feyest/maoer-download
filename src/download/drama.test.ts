import { searchDramaByName } from "./drama";

describe(searchDramaByName, () => {
  it("downloads audio to the right path", async () => {
    const searchInfo = await searchDramaByName("小蘑菇");
    console.log(searchInfo);
    expect(searchInfo.length).toBeGreaterThan(0);
  }, 10000);
});
