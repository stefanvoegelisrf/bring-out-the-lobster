using System;
using Microsoft.AspNetCore.SignalR;
namespace TrialPeriodServer
{
	public class NavigationHub:Hub
	{
		public NavigationHub()
		{
		}

		public async Task SendMessage(string message)
		{
			await Clients.All.SendAsync("ReceiveMessage", message);
		}
	}
}

