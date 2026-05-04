import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchAddresses, identifyBuilding } from "./geoadmin";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

const ok = (body: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);

describe("searchAddresses", () => {
  it("returns [] for queries shorter than 3 chars without hitting fetch", async () => {
    const r = await searchAddresses("ab");
    expect(r).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("strips HTML and swaps GeoAdmin (x=northing, y=easting) into LV95 [E,N]", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        results: [
          {
            attrs: {
              label: "Rossmattenweg 1 <b>8932 Mettmenstetten</b>",
              x: 1232944.875,
              y: 2677359.25,
              lat: 47.243,
              lon: 8.46,
              featureId: "4070_0",
            },
          },
        ],
      }),
    );

    const [first] = await searchAddresses("Rossmattenweg 1 8932");

    expect(first.label).toBe("Rossmattenweg 1 8932 Mettmenstetten");
    expect(first.lv95).toEqual([2677359.25, 1232944.875]);
    expect(first.latLon).toEqual([47.243, 8.46]);
    expect(first.featureId).toBe("4070_0");
  });

  it("requests sr=2056 and origins=address", async () => {
    fetchMock.mockReturnValueOnce(ok({ results: [] }));
    await searchAddresses("Bahnhofstrasse 1");
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("sr=2056");
    expect(url).toContain("origins=address");
    expect(url).toContain("type=locations");
    expect(url).toContain("searchText=Bahnhofstrasse+1");
  });

  it("forwards the abort signal", async () => {
    const ctrl = new AbortController();
    fetchMock.mockReturnValueOnce(ok({ results: [] }));
    await searchAddresses("Bahnhofstrasse 1", { signal: ctrl.signal });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(ctrl.signal);
  });

  it("appends the canton filter when provided", async () => {
    fetchMock.mockReturnValueOnce(ok({ results: [] }));
    await searchAddresses("Bahnhofstrasse 1", { canton: "ZH" });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("filter=kanton%3AZH");
  });

  it("throws on non-ok response", async () => {
    fetchMock.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 503 } as Response),
    );
    await expect(searchAddresses("Bahnhofstrasse 1")).rejects.toThrow(/503/);
  });

  it("treats missing featureId as empty string", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        results: [
          {
            attrs: {
              label: "X",
              x: 1,
              y: 2,
              lat: 0,
              lon: 0,
              featureId: null,
            },
          },
        ],
      }),
    );
    const [first] = await searchAddresses("xyz");
    expect(first.featureId).toBe("");
  });
});

describe("identifyBuilding", () => {
  it("returns null when no result", async () => {
    fetchMock.mockReturnValueOnce(ok({ results: [] }));
    const r = await identifyBuilding([2677359, 1232944]);
    expect(r).toBeNull();
  });

  it("uses gkode/gkodn as the centroid when present", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        results: [
          {
            layerBodId: "ch.bfs.gebaeude_wohnungs_register",
            featureId: "4070_0",
            properties: {
              egid: "4070",
              gkode: 2677362.054,
              gkodn: 1232935.132,
              gbauj: 1924,
              garea: 205,
            },
          },
        ],
      }),
    );

    const r = await identifyBuilding([2677359, 1232944]);

    expect(r?.egid).toBe("4070");
    expect(r?.centroid).toEqual([2677362.054, 1232935.132]);
    expect(r?.attributes.gbauj).toBe(1924);
  });

  it("falls back to the input coordinate when gkode/gkodn are null", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        results: [
          {
            layerBodId: "ch.bfs.gebaeude_wohnungs_register",
            featureId: "1_0",
            properties: { egid: "1", gkode: null, gkodn: null },
          },
        ],
      }),
    );
    const r = await identifyBuilding([2677359, 1232944]);
    expect(r?.centroid).toEqual([2677359, 1232944]);
  });

  it("targets the GWR layer with sr=2056", async () => {
    fetchMock.mockReturnValueOnce(ok({ results: [] }));
    await identifyBuilding([2677359, 1232944]);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain(
      "layers=all%3Ach.bfs.gebaeude_wohnungs_register",
    );
    expect(url).toContain("sr=2056");
    expect(url).toContain("geometry=2677359%2C1232944");
  });
});
