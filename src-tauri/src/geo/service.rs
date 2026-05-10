use std::collections::HashMap;

use reverse_geocoder::Record;

use crate::domain::{GeoPoint, Place};

use super::repository::geocoder;

const LATITUDE_LIMIT: f64 = 90.0;
const LONGITUDE_LIMIT: f64 = 180.0;
const CACHE_KEY_SCALE: f64 = 1_000.0;

pub fn reverse(point: &GeoPoint) -> Option<Place> {
    if !is_valid_point(point) {
        return None;
    }

    let result = geocoder().search((point.latitude, point.longitude));

    Some(record_to_place(result.record))
}

#[derive(Debug, Default)]
pub struct GeoCache {
    entries: HashMap<CacheKey, Option<Place>>,
}

impl GeoCache {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn lookup(&mut self, point: &GeoPoint) -> Option<Place> {
        if !is_valid_point(point) {
            return None;
        }

        let key = cache_key(point);

        if let Some(cached) = self.entries.get(&key) {
            return cached.clone();
        }

        let place = reverse(point);
        self.entries.insert(key, place.clone());

        place
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

type CacheKey = (i64, i64);

fn is_valid_point(point: &GeoPoint) -> bool {
    point.latitude.is_finite()
        && point.longitude.is_finite()
        && point.latitude.abs() <= LATITUDE_LIMIT
        && point.longitude.abs() <= LONGITUDE_LIMIT
}

fn cache_key(point: &GeoPoint) -> CacheKey {
    let latitude = (point.latitude * CACHE_KEY_SCALE).round() as i64;
    let longitude = (point.longitude * CACHE_KEY_SCALE).round() as i64;

    (latitude, longitude)
}

fn record_to_place(record: &Record) -> Place {
    Place {
        name: record.name.clone(),
        country: country_name(&record.cc),
    }
}

fn country_name(code: &str) -> Option<String> {
    rust_iso3166::from_alpha2(code).map(|country| country.name.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn point(latitude: f64, longitude: f64) -> GeoPoint {
        GeoPoint {
            latitude,
            longitude,
        }
    }

    #[test]
    fn reverse_resolves_known_city_and_country() {
        let manhattan = reverse(&point(40.7831, -73.9712)).expect("manhattan resolves");

        assert_eq!(manhattan.name, "Manhattan");
        assert_eq!(
            manhattan.country.as_deref(),
            Some("United States of America")
        );
    }

    #[test]
    fn reverse_resolves_european_city() {
        let paris = reverse(&point(48.8566, 2.3522)).expect("paris resolves");

        assert_eq!(paris.name, "Paris");
        assert_eq!(paris.country.as_deref(), Some("France"));
    }

    #[test]
    fn reverse_returns_none_for_nan() {
        assert!(reverse(&point(f64::NAN, 0.0)).is_none());
        assert!(reverse(&point(0.0, f64::NAN)).is_none());
    }

    #[test]
    fn reverse_returns_none_for_infinity() {
        assert!(reverse(&point(f64::INFINITY, 0.0)).is_none());
        assert!(reverse(&point(0.0, f64::NEG_INFINITY)).is_none());
    }

    #[test]
    fn reverse_returns_none_for_out_of_range_latitude() {
        assert!(reverse(&point(91.0, 0.0)).is_none());
        assert!(reverse(&point(-90.5, 0.0)).is_none());
    }

    #[test]
    fn reverse_returns_none_for_out_of_range_longitude() {
        assert!(reverse(&point(0.0, 181.0)).is_none());
        assert!(reverse(&point(0.0, -180.5)).is_none());
    }

    #[test]
    fn reverse_accepts_boundary_coordinates() {
        assert!(reverse(&point(90.0, 180.0)).is_some());
        assert!(reverse(&point(-90.0, -180.0)).is_some());
    }

    #[test]
    fn cache_returns_same_place_for_identical_points() {
        let mut cache = GeoCache::new();
        let coords = point(48.8566, 2.3522);

        let first = cache.lookup(&coords);
        let second = cache.lookup(&coords);

        assert_eq!(first.as_ref().map(|p| &p.name), Some(&"Paris".to_string()));
        assert_eq!(first, second);
        assert_eq!(cache.len(), 1);
    }

    #[test]
    fn cache_collapses_coordinates_within_rounding_radius() {
        let mut cache = GeoCache::new();

        cache.lookup(&point(48.8566, 2.3522));
        cache.lookup(&point(48.85661, 2.35221));
        cache.lookup(&point(48.85659, 2.35219));

        assert_eq!(cache.len(), 1);
    }

    #[test]
    fn cache_separates_distinct_coordinates() {
        let mut cache = GeoCache::new();

        cache.lookup(&point(48.8566, 2.3522));
        cache.lookup(&point(40.7831, -73.9712));
        cache.lookup(&point(50.4501, 30.5234));

        assert_eq!(cache.len(), 3);
    }

    #[test]
    fn cache_does_not_store_invalid_points() {
        let mut cache = GeoCache::new();

        assert!(cache.lookup(&point(f64::NAN, 0.0)).is_none());
        assert!(cache.lookup(&point(0.0, 200.0)).is_none());

        assert!(cache.is_empty());
    }

    #[test]
    fn country_name_resolves_known_alpha2() {
        assert_eq!(country_name("FR").as_deref(), Some("France"));
        assert_eq!(country_name("UA").as_deref(), Some("Ukraine"));
    }

    #[test]
    fn country_name_returns_none_for_unknown_alpha2() {
        assert!(country_name("ZZ").is_none());
        assert!(country_name("").is_none());
    }
}
