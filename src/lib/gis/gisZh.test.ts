import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  identifyDistrictHeatAvailable,
  identifyGeothermalZone,
  identifyHeritage,
} from "./gisZh";

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

const empty = () => ok({ type: "FeatureCollection", features: [] });

describe("identifyHeritage", () => {
  it("returns no nearest when the layer is empty", async () => {
    fetchMock.mockReturnValueOnce(empty());
    const r = await identifyHeritage([2677362, 1232935]);
    expect(r.nearest).toBeNull();
    expect(r.blocksFacade).toBe(false);
  });

  it("computes Euclidean distance and only blocks when within 25m", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { odb_id: 1, objekt: "Far away farm", strasse: "F 1" },
            geometry: { type: "Point", coordinates: [2677500, 1232935] },
          },
          {
            type: "Feature",
            properties: { odb_id: 2, objekt: "Adjacent house", strasse: "A 2" },
            geometry: { type: "Point", coordinates: [2677370, 1232935] },
          },
        ],
      }),
    );
    const r = await identifyHeritage([2677362, 1232935]);
    expect(r.nearest?.id).toBe(2);
    expect(r.distanceM).toBe(8);
    expect(r.blocksFacade).toBe(true);
  });

  it("does not block when the closest object is beyond the radius", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { odb_id: 1, objekt: "Pfarrhaus", strasse: "P 1" },
            geometry: { type: "Point", coordinates: [2677500, 1232935] },
          },
        ],
      }),
    );
    const r = await identifyHeritage([2677362, 1232935]);
    expect(r.nearest?.id).toBe(1);
    expect(r.blocksFacade).toBe(false);
  });

  it("falls through to the second outputFormat when the first is rejected", async () => {
    fetchMock
      .mockReturnValueOnce(Promise.resolve({ ok: false, status: 400 } as Response))
      .mockReturnValueOnce(empty());
    await identifyHeritage([2677362, 1232935]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("identifyDistrictHeatAvailable", () => {
  it("returns true when any polygon is returned", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [[[0, 0]]] },
          },
        ],
      }),
    );
    expect(await identifyDistrictHeatAvailable([2677362, 1232935])).toBe(true);
  });

  it("returns false on empty result", async () => {
    fetchMock.mockReturnValueOnce(empty());
    expect(await identifyDistrictHeatAvailable([2677362, 1232935])).toBe(false);
  });
});

describe("identifyGeothermalZone", () => {
  it("returns the zone code from the first matching polygon", async () => {
    fetchMock.mockReturnValueOnce(
      ok({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: { zonen: "A" },
            geometry: { type: "Polygon", coordinates: [[[0, 0]]] },
          },
        ],
      }),
    );
    expect(await identifyGeothermalZone([2677362, 1232935])).toBe("A");
  });

  it("returns null on empty", async () => {
    fetchMock.mockReturnValueOnce(empty());
    expect(await identifyGeothermalZone([2677362, 1232935])).toBeNull();
  });
});
