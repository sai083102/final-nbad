import { Component, OnInit } from '@angular/core';
import axios from 'axios';
import * as d3 from 'd3';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  data: any[] = [];  // The data fetched from API
  private svg: any;
  private margin = 60;
  private width = 800;
  private height = 400;

  constructor() { }

  ngOnInit(): void {
    this.fetchregionInnovations();
  }

  fetchregionInnovations(): void {
    const token = localStorage.getItem('token');  // Retrieve the token from localStorage

    if (!token) {
      console.error('No token found');
      return;
    }

    axios.get('http://143.244.144.49:3000/api/regionInnovations', {
      headers: {
        'Authorization': `Bearer ${token}`  // Attach the token in the Authorization header
      }
    }).then((response) => {
        this.data = response.data;
        console.log(this.data);
        this.createSvg();
        this.drawBarChart(this.data);
      })
      .catch((error) => {
        if (error.response && error.response.status === 401) {
          // Show an alert if the status is 401
          alert('Session Expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/'; 
        }
        console.error('Error fetching Innovations By Region data:', error);
      });
  }

  private createSvg(): void {
    this.svg = d3.select('p#bar')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin}, ${this.margin})`);
  }

  private drawBarChart(data: any[]): void {

    console.log(data)

    // Define the margin, width, and height of the chart
    const x = d3.scaleBand()
      .domain(data.map(d => d.region)) // Use region names as the x-axis scale
      .range([0, this.width - 2 * this.margin]) // Set the range based on the chart width
      .padding(0.1); // Space between bars

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.percentage_contribution) + 5]) // Set the y-axis scale to the max value of percentage_contribution
      .nice() // Add some padding for a nice display
      .range([this.height - 2 * this.margin, 0]); // Invert the y-axis (so the bars grow upwards)

    // Create the bars for the bar chart
    this.svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d:any) => x(d.region)) // Position bars based on region
      .attr('y', (d:any) => y(d.percentage_contribution)) // Position bars based on the percentage contribution
      .attr('width', x.bandwidth()) // Set the width of each bar
      .attr('height', (d:any) => this.height - 2 * this.margin - y(d.percentage_contribution)) // Set the height based on percentage
      .attr('fill', '#4CAF50'); // Set bar color

    // Add the x-axis
    this.svg.append('g')
      .attr('transform', `translate(0, ${this.height - 2 * this.margin})`)
      .call(d3.axisBottom(x));

    // Add the y-axis
    this.svg.append('g')
      .call(d3.axisLeft(y));

      this.svg.append('text')
      .attr('transform', `translate(${this.width/3}, ${this.height - 100})`)
      .style('text-anchor', 'middle')
      .text('Region'); // Label for x-axis

    // Add the y-axis label
    this.svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.height / 2 + 50)
      .attr('y', -25)
      .style('text-anchor', 'middle')
      .text('Percentage Contribution');
    
  }
}
