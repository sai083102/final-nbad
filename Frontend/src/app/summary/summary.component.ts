import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import axios from 'axios';
import * as d3 from 'd3';

@Component({
  selector: 'pb-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  data: any[] = [];  // The data fetched from the API
  private svg: any;
  private margin = 40;
  private width = 500;
  private height = 500;

  constructor() { }

  ngOnInit(): void {
    this.loadTechnologyInnovationData();
  }

  loadTechnologyInnovationData(): void {
    const token = localStorage.getItem('token'); 

    if (!token) {
      console.error('Token is missing');
      return;
    }

    axios.get('http://143.244.144.49:3000/api/technologyInnovations', {
      headers: {
        'Authorization': `Bearer ${token}`  
      }
    }).then((response) => {
      this.data = response.data;
      console.log(this.data);
      this.initializeSvg();
      this.drawPieChart(this.data);  // Generate pie chart after data is fetched
    })
    .catch((error) => {
      if (error.response && error.response.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/'; 
      }
      console.error('Error fetching technology innovation data:', error);
    });
  }

  private initializeSvg(): void {
    this.svg = d3.select('p#pie')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.width / 2}, ${this.height / 2})`);

    // Add a placeholder title for the pie chart
    d3.select('svg')
      .append('text')
      .attr('x', this.width / 2)
      .attr('y', this.margin / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text('');
  }

  private drawPieChart(data: any[]): void {
    const pie = d3.pie().value((d: any) => d); 
    const radius = Math.min(this.width, this.height) / 2 - this.margin;

    const arc = d3.arc()
      .outerRadius(radius)  
      .innerRadius(0);       

    const pieData = this.data.map(d => d.number_of_innovations);
    const pieDataFormatted = pie(pieData); 
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    this.svg.selectAll('path')
      .data(pieDataFormatted)
      .enter().append('path')
      .attr('d', (d: any) => arc(d)) 
      .attr('fill', (d: any, i: any) => color(i)) 
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    const labelArc = d3.arc()
      .outerRadius(radius - 40)  
      .innerRadius(radius - 40);

    this.svg.selectAll('text')
      .data(pieDataFormatted)
      .enter().append('text')
      .attr('transform', (d: any) => `translate(${labelArc.centroid(d)})`)
      .attr('dy', '.35em')
      .text((d: any) => {
        const technology = this.data[d.index].technology;
        const innovations = this.data[d.index].number_of_innovations;
        return `${technology}: ${innovations}`;  // Label with technology and its innovation count
      })  
      .style('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold');
  }
}
