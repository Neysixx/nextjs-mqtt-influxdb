import { InfluxDB } from '@influxdata/influxdb-client'

const url = process.env.INFLUXDB_ADDRESS || 'http://localhost:8086'
const token = process.env.INFLUXDB_TOKEN
const org = process.env.INFLUXDB_ORG
export const bucket = process.env.INFLUXDB_BUCKET
export const influxDB = new InfluxDB({ url, token })
export const queryApi = org ? influxDB.getQueryApi(org) : null

export async function queryData(query: string) {
  try {
    if (!queryApi) {
      throw new Error('InfluxDB organization is not set')
    }
    const rows = await queryApi.collectRows(query)
    return rows
  } catch (error) {
    console.error('Error querying data:', error)
    throw error
  }
}