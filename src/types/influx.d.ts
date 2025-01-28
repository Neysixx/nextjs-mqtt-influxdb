interface EquipmentResponse {
    nom_equipement: string;
    _value: string;
}

interface EquipmentFields {
    nom_equipement: string;
    fields: string[];
}

export type { EquipmentResponse, EquipmentFields };