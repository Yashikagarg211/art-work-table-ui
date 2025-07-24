import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTablePageEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import type { Artwork } from '../types/Artwork';

export const ArtworkTable = () => {
  const [data, setData] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(0);
  const [selectionMap, setSelectionMap] = useState<Record<number, boolean>>({});
  const [inputCount, setInputCount] = useState('');
  const [selectAllMode, setSelectAllMode] = useState(false); 
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const overlayRef = useRef<OverlayPanel>(null);
  const rows = 12;

  useEffect(() => {
    fetchPageData(page);
  }, [page]);

  const fetchPageData = async (pageIndex: number) => {
    setLoading(true);
    const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${pageIndex + 1}`);
    const json = await res.json();
    setData(json.data);
    setTotalRecords(json.pagination.total);
    setLoading(false);
  };

  const onPageChange = (e: DataTablePageEvent) => {
    setPage(e.page ?? 0);
  };

  const toggleSelection = (id: number, checked: boolean) => {
    setSelectionMap((prev) => ({ ...prev, [id]: checked }));
    if (!checked && selectAllMode) {
      setSelectAllMode(false);
    }
  };

  const handleBulkSelect = async () => {
    const count = parseInt(inputCount, 10);
    if (!isNaN(count) && count > 0) {
      setSelectAllLoading(true);
      
      try {
        let selectedCount = 0;
        const updated = { ...selectionMap };
        let currentPage = 1;
        setSelectAllMode(false);
        while (selectedCount < count && currentPage <= Math.ceil(totalRecords / rows)) {
          const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${currentPage}&fields=id`);
          const json = await res.json();
          
          for (const item of json.data) {
            if (selectedCount < count) {
              updated[item.id] = true;
              selectedCount++;
            } else {
              break;
            }
          }
          
          currentPage++;
        }
        
        setSelectionMap(updated);
      } catch (error) {
        console.error('Error during bulk select:', error);
      } finally {
        setSelectAllLoading(false);
      }
    }
    overlayRef.current?.hide();
  };

  const isRowSelected = (id: number) => {
    if (selectAllMode) {
      return selectionMap[id] !== false;
    }
    return !!selectionMap[id];
  };

  const getSelectedCount = () => {
    if (selectAllMode) {
      const deselectedCount = Object.values(selectionMap).filter(val => val === false).length;
      return totalRecords - deselectedCount;
    }
    return Object.values(selectionMap).filter(Boolean).length;
  };

  const selectionTemplate = (rowData: Artwork) => (
    <Checkbox
      key={rowData.id}
      checked={isRowSelected(rowData.id)}
      onChange={(e) => toggleSelection(rowData.id, e.checked!)}
    />
  );

  const isAllSelectedAcrossPages = () => {
    return selectAllMode && Object.values(selectionMap).every(val => val !== false);
  };

  const toggleAllSelectionAcrossPages = async (checked: boolean) => {
    if (checked) {
      setSelectAllLoading(true);
      const processingTime = Math.min(Math.max(totalRecords / 1000, 500), 2000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      setSelectAllMode(true);
      setSelectionMap({}); 
      setSelectAllLoading(false);
    } else {
      setSelectAllMode(false);
      setSelectionMap({});
    }
  };

  const selectHeader = (
    <div className="flex align-items-center gap-2">
      <Checkbox
        onChange={(e) => toggleAllSelectionAcrossPages(e.checked!)}
        checked={isAllSelectedAcrossPages()}
        disabled={selectAllLoading}
      />
      <Button
        icon="pi pi-chevron-down"
        className="p-button-text p-button-sm"
        onClick={(e) => overlayRef.current?.toggle(e)}
      />
      <OverlayPanel ref={overlayRef}>
        <div className="p-2">
          <input
            className="p-inputtext p-component mb-2 w-full"
            type="number"
            placeholder="Select N rows"
            value={inputCount}
            onChange={(e) => setInputCount(e.target.value)}
          />
          <Button 
            label="Submit" 
            onClick={handleBulkSelect} 
            className="w-full"
            disabled={selectAllLoading}
          />
        </div>
      </OverlayPanel>
    </div>
  );

  return (
    <div>
      <DataTable
        value={data}
        paginator
        rows={rows}
        lazy
        totalRecords={totalRecords}
        loading={loading || selectAllLoading}
        onPage={onPageChange}
        first={page * rows}
        dataKey="id"
        rowClassName={(rowData) => (isRowSelected(rowData.id) ? 'selected-row' : '')}
      >
        <Column header={selectHeader} body={selectionTemplate} />
        <Column field="title" header="Title" />
        <Column field="place_of_origin" header="Place of Origin" />
        <Column field="artist_display" header="Artist" />
        <Column field="inscriptions" header="Inscriptions" />
        <Column field="date_start" header="Start Year" />
        <Column field="date_end" header="End Year" />
      </DataTable>
    </div>
  );
};