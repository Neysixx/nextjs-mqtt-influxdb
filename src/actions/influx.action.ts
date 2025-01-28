"use server";

import { bucket, queryData } from '@/lib/influxdb'
import { ActionResponse } from '@/types/action';
import { EquipmentFields } from '@/types/influx';

interface QueryResponse {
  nom_equipement: string;
  _measurement: string;
  _value: string;
}

export async function GetDatas(): Promise<ActionResponse<EquipmentFields[]>> {
  try {
    const query = `from(bucket: "${bucket}")
      |> range(start: -100y)
      |> keep(columns: ["_measurement", "nom_equipement"])
      |> group(columns: ["nom_equipement"])
      |> distinct(column: "_measurement")`;

    const data = await queryData(query) as QueryResponse[];

    console.log("Data:", data);

    let equipments: EquipmentFields[] = [];

    data.forEach(row => {
      const equipment = row.nom_equipement;
      const field = row._value;
      
      const existingEquipment = equipments.find(e => e.nom_equipement === equipment);
      if (existingEquipment) {
        existingEquipment.fields.push(field);
      } else {
        equipments.push({ nom_equipement: equipment, fields: [field] });
      }
    });
    
    return { success: true, data: equipments };
  } catch (error) {
    return { success: false, error: 'Failed to fetch equipments' };
  }
}