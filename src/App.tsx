import { useEffect, useState } from 'react'
import './App.css'
import { Column, DatabaseUserData, FirebaseUserData, InventoryItem, UserDBData, VisionaryUser } from './types';
import { getInventory, getUser } from './fetch'
import AddItemModal from './AddItemModal';
import ThemeToggle from './components/ThemeToggle';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import InventoryDisplay from './components/InventoryDisplay';
import DatabaseSelection from './components/DatabaseSelection';

const CURRENT_INVENTORY = 'loren_paintings';
// const CURRENT_INVENTORY = 'loren_blank_canvases';

const generateColumnsFromData = (data: any[]): Column[] => {
  if (data.length === 0) return [];

  return Object.entries(data[0]).map(([key, value]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    type: typeof value === 'number' ? 'number' :
      key === 'created_at' || key === 'updated_at' ? 'date' : 'text'
  }));
};

const App = () => {
  const [loaded, setLoaded] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseUserData | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [user, setUser] = useState<VisionaryUser | null>(null);

  const fetchInv = async (dbName: string, uid: string, accessToken: string) => {
    const startTime = Date.now();
    const items = await getInventory(dbName, uid, accessToken);
    setInventoryData(items);
    console.warn(items.length, 'items fetched in', (Date.now() - startTime), 'ms');
  }

  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (user) {
      setSelectedDatabase(user?.inventoryData.databases[event.target.value]);
    }
  };

  useEffect(() => {
    const getUserData = async (firebaseUser: User): Promise<UserDBData | null> => {
      const invUser: FirebaseUserData = {
        accessToken: await firebaseUser.getIdToken(),
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoUrl: firebaseUser.photoURL,
        uid: firebaseUser.uid,
      };
      const userDBData = await getUser(invUser.uid, invUser.accessToken);
      const nextUser = {
        visionaryData: invUser,
        inventoryData: {
          databases: userDBData?.authorizations?.inventory?.databases || [],
        },
      };
      setUser(nextUser);
      return userDBData || null;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        getUserData(firebaseUser);
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> user logged in!')
      } else {
        window.location.href = 'https://visionary.tools/';
      }
      setLoaded(true);
    });

    const darkMode = localStorage.getItem('darkMode');
    if (darkMode !== null) {
      toggleDarkMode(JSON.parse(darkMode));
    } else {
      toggleDarkMode(isDarkMode);
    }

    requestAnimationFrame(() => {
      setLoaded(true);
    })
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const dbNameList = Object.keys(user.inventoryData.databases);
      if (dbNameList.length > 0 && selectedDatabase) {        // const nextDatabase = dbNameList.find((dbName) => dbName === CURRENT_INVENTORY);
        const nextDatabase = selectedDatabase.databaseMetadata.databaseName
        nextDatabase && fetchInv(nextDatabase || '', user.visionaryData.uid, user.visionaryData.accessToken);
      }
      if (!selectedDatabase) {
        setSelectedDatabase(user?.inventoryData.databases['loren_paintings']);
      }
    }
  }, [user, selectedDatabase]);

  useEffect(() => {
    if (inventoryData.length > 0) {
      // First check if columns are defined in database metadata
      const dbColumns = user?.inventoryData.databases[CURRENT_INVENTORY]?.databaseMetadata.columns;
      if (dbColumns) {
        setColumns(dbColumns);
      } else {
        // Generate columns from data if not defined in metadata
        setColumns(generateColumnsFromData(inventoryData));
      }
    }
  }, [inventoryData, user]);

  const toggleDarkMode = (newDarkState: boolean) => {
    setIsDarkMode(newDarkState);
    if (newDarkState) {
      document.documentElement.style.setProperty('--background-color', '#242424');
      document.documentElement.style.setProperty('--text-color', '#ffffffde');
      document.documentElement.style.setProperty('--accent-color', '#444');
      document.documentElement.style.setProperty('--odd-line-color', '#ffffff0d');
    } else {
      document.documentElement.style.setProperty('--background-color', '#eaeaea');
      document.documentElement.style.setProperty('--text-color', '#18181b');
      document.documentElement.style.setProperty('--accent-color', '#ccc');
      document.documentElement.style.setProperty('--odd-line-color', '#0000000d');
    }
    localStorage.setItem('darkMode', JSON.stringify(newDarkState));
  }

  return (
    <>
      <header>
        {loaded &&
          <>
          {user &&
            <div className='user-info'>
              <img src={user.visionaryData.photoUrl || ''} alt={user.visionaryData.displayName || ''} />
              <div>{user.visionaryData.displayName}</div>
            </div>
          }
            <ThemeToggle isDarkMode={isDarkMode} onToggle={() => toggleDarkMode(!isDarkMode)} />
          </>
        }
      </header>
      <main style={{ opacity: loaded ? 1 : 0 }}>
        {(user && selectedDatabase && inventoryData.length > 0) ?
          <>            
            <DatabaseSelection
              databases={Object.values(user?.inventoryData?.databases || {}) || []}
              selectedDatabase={selectedDatabase}
              onDatabaseSelect={handleSelectionChange}
            />
            <InventoryDisplay
              currentInventory={selectedDatabase}
              data={inventoryData}
              columns={columns}
              user={user}
              openModal={openModal}
            />
          </>
          :
          <div>loading...</div>
        }
        <AddItemModal isOpen={isModalOpen} onClose={closeModal} />
      </main>
      <footer>made with ❤️ by mike@mikedonovan.dev</footer>
    </>
  )
}

export default App;
