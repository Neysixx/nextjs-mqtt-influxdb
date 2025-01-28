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
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Label } from './ui/label'
import { Button } from './ui/button'
import { ButtonSubmit } from './ui/shuip/button.submit'
import { zodResolver } from "@hookform/resolvers/zod"
import { set, useForm } from "react-hook-form"
import { z } from "zod"
import { useToast } from '@/hooks/use-toast'
import { PublishMessage } from '@/actions/mqtt.action'

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
                            <Item key={index} field={field} equipmentName={equipment.nom_equipement} />
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div >
    )
};


const formSchema = z.object({
    value: z.string().nonempty("Valeur requise").refine((value:string) => {
        return !isNaN(Number(value));
    }, {
        message: "La valeur doit être un nombre"
    }),
})

export function Item({ field, equipmentName }: { field: string, equipmentName: string }) {
    const { toast } = useToast()

    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            value: "",
        },
    })

    async function onSubmit(data: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const payload = {
                propertyId: equipmentName,
                requestType: "write",
                value: Number(data.value)
            }
            
            // Use more specific topic
            const topic = `command/${payload.propertyId}/${field}`;
            const response = await PublishMessage(topic, JSON.stringify(payload))

            if (!response.success) {
                throw new Error(response.error)
            }

            toast({
                title: "Commande envoyée",
                description: "La commande a été envoyée avec succès",
            })
            setOpen(false)
        } catch (error) {
            console.error('Error sending command:', error)
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Une erreur s'est produite lors de l'envoi de la commande",
            })
        }
        setIsLoading(false)
    }

    return (
        <div className='flex items-center gap-10 py-4'>
            <p>{field}</p>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button size={"icon"}>
                        <Edit size={18} />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <Form {...form}>
                        <form className="space-y-8">
                            <DialogHeader>
                                <DialogTitle>Envoyer une commande</DialogTitle>
                                <DialogDescription>
                                    Cliquer sur le bouton pour écrire la nouvelle valeur du champ
                                </DialogDescription>
                            </DialogHeader>
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nouvelle valeur</FormLabel>
                                        <FormControl>
                                            <Input type='number' placeholder="Valeur..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <ButtonSubmit label="Envoyer" type="submit" loading={isLoading} onClick={form.handleSubmit(onSubmit)} />
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}