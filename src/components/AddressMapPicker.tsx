import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

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
    if (!showMap || !mapContainer.current) return;

    // 지도 초기화
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([37.5665, 126.978], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // GeoSearch 컨트롤 추가
      const provider = new OpenStreetMapProvider();
      const searchControl = new GeoSearchControl({
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
    }

    // 기존 마커 제거
    if (marker.current) {
      map.current.removeLayer(marker.current);
    }

    // 주소가 있으면 검색해서 마커 표시
    if (address && map.current) {
      const provider = new OpenStreetMapProvider();
      provider.search({ query: address }).then((results: any) => {
        if (results.length > 0) {
          const result = results[0];
          const { x, y } = result;
          map.current?.setView([y, x], 15);

          marker.current = L.marker([y, x])
            .addTo(map.current!)
            .bindPopup(address)
            .openPopup();
        }
      });
    }

    return () => {
      // 컴포넌트 언마운트 시 지도 리소스 정리
    };
  }, [showMap, address, onAddressChange]);

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="주소를 입력하거나 지도에서 검색"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={() => setShowMap(!showMap)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
        >
          {showMap ? '지도 닫기' : '지도 열기'}
        </button>
      </div>

      {showMap && (
        <div
          ref={mapContainer}
          className="w-full h-64 rounded border border-gray-300 mb-4"
        />
      )}
    </div>
  );
};
