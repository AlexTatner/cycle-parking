import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

interface Feature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    FEATURE_ID: string;
    SVDATE: string;
    PRK_CARR: 'TRUE' | 'FALSE';
    PRK_COVER: 'TRUE' | 'FALSE';
    PRK_SECURE: 'TRUE' | 'FALSE';
    PRK_LOCKER: 'TRUE' | 'FALSE';
    PRK_SHEFF: 'TRUE' | 'FALSE';
    PRK_MSTAND: 'TRUE' | 'FALSE';
    PRK_PSTAND: 'TRUE' | 'FALSE';
    PRK_HOOP: 'TRUE' | 'FALSE';
    PRK_POST: 'TRUE' | 'FALSE';
    PRK_BUTERF: 'TRUE' | 'FALSE';
    PRK_WHEEL: 'TRUE' | 'FALSE';
    PRK_HANGAR: 'TRUE' | 'FALSE';
    PRK_TIER: 'TRUE' | 'FALSE';
    PRK_OTHER: 'TRUE' | 'FALSE';
    PRK_PROVIS: number;
    PRK_CPT: number;
    BOROUGH: string;
    PHOTO1_URL: string;
    PHOTO2_URL: string;
  };
}

interface FeatureCollection {
  type: 'FeatureCollection';
  name: 'cycle_parking';
  features: Feature[];
}

const pool = new Pool();

async function loadData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating PostGIS extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis');

    console.log('Creating table: cycle_parking');
    await client.query(`
      CREATE TABLE IF NOT EXISTS cycle_parking (
        id SERIAL PRIMARY KEY,
        feature_id VARCHAR(255) UNIQUE,
        svdate DATE,
        prk_carr BOOLEAN,
        prk_cover BOOLEAN,
        prk_secure BOOLEAN,
        prk_locker BOOLEAN,
        prk_sheff BOOLEAN,
        prk_mstand BOOLEAN,
        prk_pstand BOOLEAN,
        prk_hoop BOOLEAN,
        prk_post BOOLEAN,
        prk_buterf BOOLEAN,
        prk_wheel BOOLEAN,
        prk_hangar BOOLEAN,
        prk_tier BOOLEAN,
        prk_other BOOLEAN,
        prk_provis INTEGER,
        prk_cpt INTEGER,
        borough VARCHAR(255),
        photo1_url VARCHAR(255),
        photo2_url VARCHAR(255),
        location GEOMETRY(Point, 4326)
      )
    `);

    console.log('Reading data file...');
    const dataPath = path.join(__dirname, '..', 'data', 'cycle_parking.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const jsonData: FeatureCollection = JSON.parse(data);

    console.log(`Found ${jsonData.features.length} features. Inserting into database...`);

    for (const feature of jsonData.features) {
      const { properties, geometry } = feature;
      const { coordinates } = geometry;
      const point = `POINT(${coordinates[0]} ${coordinates[1]})`;

      const query = `
        INSERT INTO cycle_parking (
          feature_id, svdate, prk_carr, prk_cover, prk_secure, prk_locker,
          prk_sheff, prk_mstand, prk_pstand, prk_hoop, prk_post, prk_buterf,
          prk_wheel, prk_hangar, prk_tier, prk_other, prk_provis, prk_cpt,
          borough, photo1_url, photo2_url, location
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, ST_SetSRID(ST_GeomFromText($22), 4326)
        ) ON CONFLICT (feature_id) DO NOTHING
      `;

      const values = [
        properties.FEATURE_ID,
        properties.SVDATE,
        properties.PRK_CARR === 'TRUE',
        properties.PRK_COVER === 'TRUE',
        properties.PRK_SECURE === 'TRUE',
        properties.PRK_LOCKER === 'TRUE',
        properties.PRK_SHEFF === 'TRUE',
        properties.PRK_MSTAND === 'TRUE',
        properties.PRK_PSTAND === 'TRUE',
        properties.PRK_HOOP === 'TRUE',
        properties.PRK_POST === 'TRUE',
        properties.PRK_BUTERF === 'TRUE',
        properties.PRK_WHEEL === 'TRUE',
        properties.PRK_HANGAR === 'TRUE',
        properties.PRK_TIER === 'TRUE',
        properties.PRK_OTHER === 'TRUE',
        properties.PRK_PROVIS,
        properties.PRK_CPT,
        properties.BOROUGH,
        properties.PHOTO1_URL,
        properties.PHOTO2_URL,
        point,
      ];

      await client.query(query, values);
    }

    console.log('Creating spatial index...');
    await client.query('CREATE INDEX IF NOT EXISTS cycle_parking_location_idx ON cycle_parking USING GIST (location)');

    await client.query('COMMIT');
    console.log('Data loaded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error loading data:', error);
  } finally {
    client.release();
    pool.end();
  }
}

loadData();
