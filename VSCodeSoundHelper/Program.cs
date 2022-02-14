using System;
using System.Media;
using System.IO;
using System.Threading;
using System.Reflection;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Collections.Generic;

namespace VSCodeSoundHelper
{
    class Program
    {
        static void Main(string[] args)
        {
            //foreach (var s in args)
            //    Console.WriteLine(s);
            var path = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            List<SoundPlayer> players = new List<SoundPlayer>();
            players.Add(new SoundPlayer(path + "\\arrow.wav"));
            players.Add(new SoundPlayer(path + "\\cut.wav"));
            players.Add(new SoundPlayer(path + "\\delete.wav"));
            players.Add(new SoundPlayer(path + "\\enter.wav"));
            players.Add(new SoundPlayer(path + "\\key.wav"));
            players.Add(new SoundPlayer(path + "\\paste.wav"));
            players.Add(new SoundPlayer(path + "\\spacebar.wav"));
            players.Add(new SoundPlayer(path + "\\tab.wav"));
            var localEP = new IPEndPoint(IPAddress.Loopback, 6969);

            var listener = new Socket(IPAddress.Loopback.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
            listener.Bind(localEP);
            listener.Listen(10);
            var handler = listener.Accept();
            while (handler.Connected)
            {
                try
                {

                    string data = null;
                    byte[] bytes = null;
                    bytes = new byte[2];
                    int bytesRec = handler.Receive(bytes);
                    data += Encoding.ASCII.GetString(bytes, 0, bytesRec);

                    int index = int.Parse(data);
                    players[index].Play();
                    //Console.ReadLine();
                }
                catch (Exception e)
                {
                    break;
                }
            }


            handler.Shutdown(SocketShutdown.Both);
            handler.Close();
        }
    }
}
