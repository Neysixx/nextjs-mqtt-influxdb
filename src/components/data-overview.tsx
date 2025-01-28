import { GetDatas } from '@/actions/influx.action'
import { useEffect, useState } from 'react'
import Spinner from '@/components/spinner'
import { EquipmentFields } from '@/types/influx'
import { Input } from "@/components/ui/input"
import { Edit, Search } from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from './ui/label'
import { Button } from './ui/button'
import { ButtonSubmit } from './ui/shuip/button.submit'

export default function DataOverview() {
    const [data, setData] = useState<EquipmentFields[] | null>()
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState<string>('')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await GetDatas()
                if (response.success) {
                    setData(response.data)
                } else {
                    console.error('Error fetching data:', response.error)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredData = data?.filter(equipment =>
        equipment.nom_equipement.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return <Spinner />

    return (
        <div>
            <h2>InfluxDB Data ({filteredData?.length ?? 0} equipments)</h2>
            <div className='w-96'>
                <Input
                    startIcon={Search}
                    type="text"
                    placeholder="Nom de l'équipement..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div>
                {filteredData?.map((equipment, index) => (
                    <Equipment key={index} equipment={equipment} />
                ))}
            </div>
        </div>
    )
}

export function Equipment({ equipment }: { equipment: EquipmentFields }) {
    return (
        <div>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={equipment.nom_equipement}>
                    <AccordionTrigger>{equipment.nom_equipement}</AccordionTrigger>
                    <AccordionContent>
                        {equipment.fields.map((field, index) => (
                            <Item key={index} field={field} />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div >
    )
};

export function Item({ field }: { field: string }) {
    return (
        <div className='flex items-center gap-10 py-4'>
            <p>{field}</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size={"icon"}>
                        <Edit size={18} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Envoyer une commande</DialogTitle>
                        <DialogDescription>
                            Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Valeur
                            </Label>
                            <Input
                                id="value"
                                defaultValue=""
                                containerClassName='col-span-3'
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <ButtonSubmit label="Envoyer" type="submit" onClick={() => {}} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}