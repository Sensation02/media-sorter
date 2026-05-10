use std::sync::OnceLock;

use reverse_geocoder::ReverseGeocoder;

static GEOCODER: OnceLock<ReverseGeocoder> = OnceLock::new();

pub fn geocoder() -> &'static ReverseGeocoder {
    GEOCODER.get_or_init(ReverseGeocoder::new)
}
