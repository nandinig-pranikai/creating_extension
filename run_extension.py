import asyncio
import websockets

async def handle(websocket):
    print("Client connected")
    with open("output.webm", "wb") as f:
        async for message in websocket:
            f.write(message)
    print("Client disconnected")

async def main():
    async with websockets.serve(handle, "0.0.0.0", 8766):
        print("Server running on ws://0.0.0.0:8766")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
