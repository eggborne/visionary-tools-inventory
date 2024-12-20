import { Fragment, useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import styles from './InventoryDisplay.module.css';
import { Column, DatabaseUserData, DataItem, GroupedDataItem, LabelOption, SortConfig, SortOption, VisionaryUser } from '../types';
import InventoryGrid from './InventoryGrid';

interface InventoryDisplayProps {
  user: VisionaryUser;
  currentInventory: DatabaseUserData;
  data: DataItem[];
  columns: Column[];
  openModal: () => void;
}

const defaultFormatters = {
  text: (value: any) => value?.toString() || value,
  number: (value: any) => value?.toString() || value,
  date: (value: any) => new Date(value).toLocaleDateString()
};

const InventoryDisplay = ({ currentInventory, data, columns, openModal }: InventoryDisplayProps) => {
  const [groupIdentical, setGroupIdentical] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'width', direction: 'desc' });
  console.log('showing', currentInventory)

  const hasIdenticalItems = useMemo(() => {
    const itemSet = new Set();
    for (const item of data) {
      const key = Object.entries(item)
        .filter(([k]) => k !== 'id')
        .map(([_, v]) => JSON.stringify(v))
        .join('|');

      if (itemSet.has(key)) {
        return true;
      }
      itemSet.add(key);
    }
    setGroupIdentical(false);
    return false;
  }, [data]);

  const sortData = (items: DataItem[], config: SortConfig) => {
    return [...items].sort((a, b) => {
      let valueA = a[config.key];
      let valueB = b[config.key];

      const comparison = typeof valueA === 'number' && typeof valueB === 'number'
        ? valueA - valueB
        : String(valueA).localeCompare(String(valueB));

      return config.direction === 'asc' ? comparison : -comparison;
    });
  };

  const processedData = useMemo(() => {
    let processed = [...data];
    if (groupIdentical) {
      const groups = data.reduce<Record<string, DataItem & { quantity: number }>>((acc, item) => {
        // Create a unique key from all values except ID
        const key = Object.entries(item)
          .filter(([k]) => k !== 'id')
          .map(([_, v]) => v)
          .join('-');

        if (!acc[key]) {
          acc[key] = { ...item, quantity: 1 };
        } else {
          acc[key].quantity++;
        }
        return acc;
      }, {});
      processed = Object.values(groups);
    }

    return sortConfig.key ? sortData(processed, sortConfig) : processed;
  }, [data, groupIdentical, sortConfig]);

  // const handleSort = (key: string) => {
  //   setSortConfig(current => ({
  //     key,
  //     direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
  //   }));
  // };

  // const SortIcon = ({ columnKey }: { columnKey: string }) => {
  //   if (sortConfig.key !== columnKey) {
  //     return <ArrowUpDown className={styles.sortIcon} />;
  //   }
  //   return sortConfig.direction === 'asc'
  //     ? <ArrowUp className={`${styles.sortIcon} ${styles.active}`} />
  //     : <ArrowDown className={`${styles.sortIcon} ${styles.active}`} />;
  // };

  const labelOptions: Record<string, LabelOption> = {
    id: {
      shortName: 'ID',
      longName: 'Item ID',
      specialType: 'id'
    },
    width: {
      shortName: 'W',
      longName: 'Width',
      specialType: 'dimension'
    },
    height: {
      shortName: 'H',
      longName: 'Height',
      specialType: 'dimension'
    },
    depth: {
      shortName: 'D',
      longName: 'Depth',
      specialType: 'dimension'
    },
    price: {
      specialType: 'usd'
    }
  };

  const columnFilters: Record<any, any> = {
    id: {
      prepend: '#',
    },
    boolean: {
      replace: {
        0: 'No',
        1: 'Yes'
      }
    },
    dimension: {
      append: '"',
    },
    usd: {
      prepend: 'S'
    },
    width: {
      append: '"',
    },
    height: {
      append: `"`,
    },
    depth: {
      append: `"`,
    },
    price: {
      prepend: '$',
    },
    wired: {
      replace: {
        0: 'No',
        1: 'Yes',
      }
    },
    signed: {
      replace: {
        0: 'No',
        1: 'Yes',
      }
    },
    wrapped: {
      replace: {
        0: 'No',
        1: 'Yes',
      }
    },
    urgent: {
      replace: {
        0: 'No',
        1: 'Yes',
      }
    }
  };

  const processItem = (item: DataItem) => {
    const processedItem = { ...item };
    for (const key in columnFilters) {
      if (processedItem[key] !== null && processedItem[key] !== undefined) {
        if (columnFilters[key].prepend) {
          processedItem[key] = columnFilters[key].prepend + processedItem[key];
        }
        if (columnFilters[key].append) {
          processedItem[key] = processedItem[key] + columnFilters[key].append;
        }
        if (columnFilters[key].replace) {
          processedItem[key] = columnFilters[key].replace[processedItem[key]];
        }
      }
    }
    return processedItem;
  }

  const renderCell = (item: DataItem, column: Column) => {
    const formatter = column.format || defaultFormatters[column.type] || undefined;
    let cellContent = formatter ? formatter(item[column.key]) : item[column.key];
    cellContent = processItem(item)[column.key];
    return cellContent;
  };



  const sortOptions: SortOption[] = useMemo(() =>
    columns.map(col => ({
      value: col.key,
      label: col.label
    }))
    , [columns]);

  const sortedData = useMemo(() => {
    let processed: GroupedDataItem[] = [...data];
    if (sortConfig.key) {
      processed.sort((a, b) => {
        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];

        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;

        const comparison = typeof valueA === 'number' && typeof valueB === 'number'
          ? valueA - valueB
          : String(valueA).localeCompare(String(valueB));

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return processed;
  }, [data, groupIdentical, sortConfig]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSortConfig(prev => ({ ...prev, key: event.target.value }));
  };

  const toggleSortDirection = (): void => {
    setSortConfig(prev => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };





  return (
    <div className={styles.container}>
      {/* {currentInventory.databaseMetadata.displayName} */}
      <button type='button' className='add-button' onClick={openModal}>
        Add new
      </button>

      <div className={styles.controls}>
        {hasIdenticalItems && ( // Conditionally render the toggle
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={groupIdentical}
              onChange={(e) => setGroupIdentical(e.target.checked)}
              className={styles.toggleInput}
            />
            Group identical items
          </label>
        )}
      </div>

      <div className={styles.inventoryGrid}>
        <div className={styles.sortControls}>
          <div className={styles.sortSelect}>
            <span className={styles.sortLabel}>Sort by:</span>
            <select
              className={styles.select}
              value={sortConfig.key}
              onChange={handleSortChange}
            >
              <option value="">None</option>
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {sortConfig.key && (
            <button
              className={styles.directionButton}
              onClick={toggleSortDirection}
              type="button"
              aria-label={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ArrowUpDown />
            </button>
          )}
        </div>

        <div className={styles.inventoryGrid}>
          <div>

          </div>
          <div className={styles.cardContainer}>
            {processedData.map((item, index) => (
              <div key={item.id || index} className={styles.card}>
                {item.id && <div className={styles.id}>#{item.id}</div>}
                {groupIdentical && <div className={styles.quantity}>Quantity: {item.quantity || 1}</div>}

                <div className={styles.title}>{item.title || '[no title]'}</div>

                {/* Dimensions section */}
                <div className={styles.dimensions}>
                  {['width', 'height', 'depth'].map(dim =>
                    item[dim] != null && (
                      <div key={dim} className={styles.dimension}>
                        <span className={styles.dimensionLabel}>
                          {dim[0].toUpperCase()}
                        </span>
                        <span className={styles.dimensionValue}>
                          {item[dim]}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Other metadata */}
                <div className={styles.metadata}>
                  {columns
                    .filter(col => !['id', 'title', 'width', 'height', 'depth'].includes(col.key))
                    .map(col => item[col.key] != null && (
                      <Fragment key={col.key}>
                        <div className={styles.label}>{col.label}:</div>
                        <div>{item[col.key]}</div>
                      </Fragment>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default InventoryDisplay;