import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import { MapPin, Map } from 'lucide-react';

interface AddressMapPickerProps {
  address: string;
  onAddressChange: (address: string) => void;
}

export const AddressMapPicker = ({ address, onAddressChange }: AddressMapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (!showMap) {
      // 지도 닫을 때 리소스 정리
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      return;
    }

    if (!mapContainer.current) return;

    // 지도 초기화
    map.current = L.map(mapContainer.current).setView([37.5665, 126.978], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);

    // GeoSearch 컨트롤 추가
    const provider = new OpenStreetMapProvider();
    const searchControl = new (GeoSearchControl as any)({
      provider,
      style: 'bar',
      showMarker: true,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
    });

    map.current.addControl(searchControl);

    // 검색 결과 이벤트
    map.current.on('geosearch/showlocation', (result: any) => {
      const locationName = result.location?.label || '';
      onAddressChange(locationName);
    });

    // 주소가 있으면 검색해서 마커 표시
    if (address) {
      const provider = new OpenStreetMapProvider();
      provider.search({ query: address }).then((results: any) => {
        if (results.length > 0 && map.current) {
          const result = results[0];
          const { x, y } = result;
          map.current.setView([y, x], 15);

          // 기존 마커 제거
          if (marker.current) {
            map.current.removeLayer(marker.current);
          }

          marker.current = L.marker([y, x])
            .addTo(map.current)
            .bindPopup(address)
            .openPopup();
        }
      });
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap, address, onAddressChange]);

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="주소를 입력하거나 지도에서 검색하세요"
            className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all bg-white shadow-2xs"
          />
          <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border flex items-center gap-1.5 cursor-pointer shrink-0 ${
            showMap
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>{showMap ? '지도 닫기' : '지도 열기'}</span>
        </button>
      </div>

      {showMap && (
        <div
          ref={mapContainer}
          className="w-full h-64 rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4"
        />
      )}
    </div>
  );
};

