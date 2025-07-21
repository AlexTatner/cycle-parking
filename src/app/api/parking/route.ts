import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool();

export async function GET(request: NextRequest) {
  const client = await pool.connect();
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    let result;

    if (lat && lon) {
      // If lat and lon are provided, find the 100 nearest parking spots
      const latFloat = parseFloat(lat);
      const lonFloat = parseFloat(lon);

      result = await client.query(
        `SELECT feature_id, borough, prk_cpt, photo1_url, ST_AsGeoJSON(location) as location
         FROM cycle_parking
         ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
         LIMIT 100`,
        [lonFloat, latFloat]
      );
    } else {
      // Otherwise, return the first 100 as before
      result = await client.query('SELECT feature_id, borough, prk_cpt, photo1_url, ST_AsGeoJSON(location) as location FROM cycle_parking LIMIT 100');
    }

    const features = result.rows.map(row => {
      const location = JSON.parse(row.location);
      return {
        type: 'Feature',
        geometry: location,
        properties: {
          featureId: row.feature_id,
          borough: row.borough,
          capacity: row.prk_cpt,
          photoUrl: row.photo1_url,
        },
      };
    });

    return NextResponse.json({
      type: 'FeatureCollection',
      features: features,
    });
  } catch (error) {
    console.error('Error fetching parking data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
