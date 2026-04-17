import typer
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
import time
import requests
import json

app = typer.Typer(help="Stellar Intent Engine (SIE) CLI")
console = Console()

BACKEND_URL = "http://localhost:8000"

@app.command()
def execute(intent: str):
    """
    Parse intent and execute on Stellar.
    """
    console.print(f"[bold blue]SIE[/bold blue] > [italic]Parsing intent: \"{intent}\"[/italic]")
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        progress.add_task(description="Running solvers Selection...", total=None)
        time.sleep(1.5) # Simulate AI thinking
        
        try:
            # First, get solvers/strategies
            response = requests.post(f"{BACKEND_URL}/solve", json={"intent": intent})
            if response.status_code != 200:
                console.print(f"[bold red]Error:[/bold red] Backend not reachable. Ensure backend is running.")
                return
                
            data = response.json()
            solvers = data["solvers"]
            best_id = data["best_solver_id"]
            ai_reasoning = data["ai_reasoning"]
            
            # Display Solver Comparison
            table = Table(title="Solver Strategy Comparison")
            table.add_column("Solver", style="cyan")
            table.add_column("Est. Output", style="green")
            table.add_column("Fee (XLM)", style="yellow")
            table.add_column("Risk Score", style="red")
            table.add_column("Optimal", style="magenta")
            
            for s in solvers:
                is_best = "⭐ YES" if s["id"] == best_id else "-"
                table.add_row(
                    s["name"], 
                    f"{s['est_output']} {s['asset']}", 
                    str(s['fee']), 
                    str(s['risk']),
                    is_best
                )
            
            console.print(table)
            
            console.print("\n[bold magenta]AI Decision Reasoning:[/bold magenta]")
            console.print(f"> {ai_reasoning}")
            
            # Execute
            if typer.confirm("\nExecute selected strategy?"):
                progress.add_task(description="Building transaction...", total=None)
                time.sleep(1)
                
                # Execute on backend
                exe_res = requests.post(f"{BACKEND_URL}/execute", json={
                    "intent": intent, 
                    "solver_id": best_id
                })
                
                if exe_res.status_code == 200:
                    tx_data = exe_res.json()
                    console.print(f"\n[bold green]Transaction Successful![/bold green]")
                    console.print(f"Hash: [link={tx_data['explorer_url']}]{tx_data['hash']}[/link]")
                    console.print(f"Proof of Optimality: [italic]{tx_data['proof']}[/italic]")
                else:
                    console.print("[bold red]Transaction Execution Failed.[/bold red]")
                    
        except Exception as e:
            console.print(f"[bold red]Error:[/bold red] {str(e)}")

@app.command()
def status():
    """Check status of SIE services."""
    try:
        res = requests.get(f"{BACKEND_URL}/health")
        if res.status_code == 200:
            console.print("[bold green]SIE Backend is ONLINE[/bold green]")
        else:
            console.print("[bold red]SIE Backend is ERROR[/bold red]")
    except:
        console.print("[bold red]SIE Backend is OFFLINE[/bold red]")

if __name__ == "__main__":
    app()
