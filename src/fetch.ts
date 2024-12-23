import axios from 'axios';
import { InventoryItem, UserDBData } from './types';

const API_BASE_URL = 'https://visionary.tools/api';

async function getUser(uid: string, accessToken: string): Promise<UserDBData | undefined> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, accessToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const userData = await response.json();
    console.log('User data:', userData);
    return userData;

  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}

async function updateUserPreferences(uid: string, accessToken: string, prop: string, newValue: Record<string, any> | string | number): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uid, accessToken, prop, newValue }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

const getInventory = async (inventoryName: string, uid: string, accessToken: string): Promise<InventoryItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inventoryName, uid, accessToken }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (response.status === 200) {
      const inventoryData = await response.json();
      return inventoryData;
    } else {
      throw new Error('Failed to fetch inventory data');
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
}

const addNewItem = async (newItem: InventoryItem): Promise<void> => {
  console.log('sending', newItem);
  try {
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}/addnewitem.php`,
      data: newItem,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const result = response.data;

    if (result.error) {
      throw new Error(result.error + (result.details ? `: ${result.details}` : ''));
    }

  } catch (error) {
    console.error('Error adding new item:', error);
    throw error;
  }
};


export { addNewItem, getInventory, getUser, updateUserPreferences };