"use server";
import { ActionResponse } from "@/types/action";
import mqtt from 'mqtt';

const BROKER_CONFIG = {
    host: process.env.MQTT_HOST || 'localhost',
    port: parseInt(process.env.MQTT_PORT || '1883'),
    protocol: 'mqtt' as mqtt.MqttProtocol,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `nextjs_${Math.random().toString(16).slice(3)}`,
    clean: true,
    reconnectPeriod: 0, // Désactive la reconnexion automatique
    connectTimeout: 30 * 1000,
    keepalive: 60,
    protocolVersion: 4,
    rejectUnauthorized: false // Si TLS/SSL
};

let mqttClient: mqtt.MqttClient | null = null;

async function Connect(): Promise<ActionResponse<mqtt.MqttClient>> {
    return new Promise((resolve) => {
        if (mqttClient) {
            mqttClient.end(true);
            mqttClient = null;
        }

        try {
            const client = mqtt.connect(`mqtt://${BROKER_CONFIG.host}:${BROKER_CONFIG.port}`, {
                ...BROKER_CONFIG as mqtt.IClientOptions,
                will: {
                    topic: 'client/disconnect',
                    payload: 'Connection closed abnormally!',
                    qos: 0,
                    retain: false
                }
            });

            client.on('connect', () => {
                console.log('Successfully connected to MQTT broker');
                mqttClient = client;
                resolve({ success: true, data: client });
            });

            client.on('error', (error) => {
                console.error('MQTT connection error:', error);
                client.end(true);
                resolve({ success: false, error: `Connection error: ${error.message}` });
            });

            client.on('close', () => {
                console.log('MQTT connection closed');
            });

            setTimeout(() => {
                if (!client.connected) {
                    client.end(true);
                    resolve({ success: false, error: 'Connection timeout' });
                }
            }, BROKER_CONFIG.connectTimeout);

        } catch (error) {
            console.error('MQTT connection error:', error);
            resolve({ success: false, error: 'Failed to connect to MQTT Broker' });
        }
    });
}

export async function PublishMessage(topic: string, message: string): Promise<ActionResponse<boolean>> {
    try {
        console.log(`Attempting to publish to topic: ${topic}`);
        const connection = await Connect();
        
        if (!connection.success) {
            return connection;
        }

        const client = connection.data;
        
        return new Promise((resolve) => {
            console.log(`Publishing message: ${message}`);
            client.publish(topic, message, { qos: 1, retain: false }, (error) => {
                if (error) {
                    console.error('MQTT publish error:', error);
                    client.end(true);
                    resolve({ success: false, error: `Failed to publish: ${error.message}` });
                    return;
                }

                console.log('Message published successfully');
                setTimeout(() => {
                    client.end(true, () => {
                        console.log('Connection closed after successful publish');
                        resolve({ success: true, data: true });
                    });
                }, 1000);
            });
        });
    } catch (error) {
        console.error('MQTT publish error:', error);
        return { success: false, error: 'Failed to publish message' };
    }
}